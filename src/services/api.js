/**
 * API client for interacting with Cloudflare Pages Functions (/api/stats, /api/upload)
 * Includes a localStorage fallback for standalone local Vite preview if Wrangler is not running.
 */

const LOCAL_STORAGE_KEY = 'skola_suplovani_records_v1';

// Seed sample records for preview if empty
export const SAMPLE_RECORDS = [
  {
    date: '2026-11-04',
    teacher_name: 'Mgr. Novák Jan',
    original_teacher: 'Mgr. Svobodová Jana',
    type: 'HODINA',
    hour_slot: '2.',
    subject: 'Matematika',
    classroom: 'U14 (2.A)',
  },
  {
    date: '2026-11-04',
    teacher_name: 'Mgr. Novák Jan',
    original_teacher: 'Ing. Černý Michal',
    type: 'DOZOR',
    hour_slot: 'Přestávka po 2. hod.',
    subject: 'Dohled - 1. patro',
    classroom: 'Chodba A',
  },
  {
    date: '2026-11-04',
    teacher_name: 'Mgr. Dvořáková Petra',
    original_teacher: 'Mgr. Svobodová Jana',
    type: 'HODINA',
    hour_slot: '3.',
    subject: 'Český jazyk',
    classroom: 'U08 (3.B)',
  },
  {
    date: '2026-11-04',
    teacher_name: 'Mgr. Dvořáková Petra',
    original_teacher: 'PaedDr. Horák Tomáš',
    type: 'DOZOR',
    hour_slot: 'Velká přestávka',
    subject: 'Dohled - jídelna',
    classroom: 'Školní jídelna',
  },
  {
    date: '2026-11-04',
    teacher_name: 'Mgr. Dvořáková Petra',
    original_teacher: 'Mgr. Veselá Marie',
    type: 'DOZOR',
    hour_slot: 'Přestávka po 4. hod.',
    subject: 'Dohled - šatny',
    classroom: 'Přízemí',
  },
  {
    date: '2026-11-03',
    teacher_name: 'Ing. Černý Michal',
    original_teacher: 'Mgr. Novák Jan',
    type: 'HODINA',
    hour_slot: '1.',
    subject: 'Informatika',
    classroom: 'LAB-INF',
  },
  {
    date: '2026-11-03',
    teacher_name: 'PaedDr. Horák Tomáš',
    original_teacher: 'Mgr. Dvořáková Petra',
    type: 'HODINA',
    hour_slot: '4.',
    subject: 'Dějepis',
    classroom: 'U11',
  },
  {
    date: '2026-11-02',
    teacher_name: 'Mgr. Veselá Marie',
    original_teacher: 'Ing. Černý Michal',
    type: 'HODINA',
    hour_slot: '5.',
    subject: 'Anglický jazyk',
    classroom: 'U05',
  },
  {
    date: '2026-11-02',
    teacher_name: 'Mgr. Veselá Marie',
    original_teacher: 'Mgr. Svobodová Jana',
    type: 'DOZOR',
    hour_slot: 'Přestávka po 5. hod.',
    subject: 'Dohled - dvůr',
    classroom: 'Areál školy',
  },
];

function getLocalRecords() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SAMPLE_RECORDS));
      return SAMPLE_RECORDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SAMPLE_RECORDS;
  }
}

function saveLocalRecords(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export async function fetchStats(startDate, endDate) {
  try {
    const response = await fetch(`/api/stats?startDate=${startDate}&endDate=${endDate}`);
    if (response.ok) {
      return await response.json();
    }
    // If backend returns error or 404 (local Vite dev without Wrangler)
    throw new Error(`Server returned ${response.status}`);
  } catch (err) {
    console.warn('API endpoint unavailable, using local mock data:', err.message);
    return getLocalStatsMock(startDate, endDate);
  }
}

export async function uploadRecords(date, records) {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, records }),
    });

    if (response.ok) {
      return await response.json();
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server vrátil kód ${response.status}`);
  } catch (err) {
    console.warn('Backend /api/upload failed or unavailable, persisting to local storage:', err.message);
    // Local fallback
    const all = getLocalRecords();
    const filtered = all.filter((r) => r.date !== date);
    const updated = [...filtered, ...records];
    saveLocalRecords(updated);
    return {
      success: true,
      message: `Úspěšně uloženo ${records.length} záznamů pro datum ${date} (režim prohlížeče).`,
      count: records.length,
      date,
      isLocalFallback: true,
    };
  }
}

function getLocalStatsMock(startDate, endDate) {
  const allRecords = getLocalRecords();
  const filtered = allRecords.filter((r) => r.date >= startDate && r.date <= endDate);

  // Group by teacher
  const teacherMap = {};
  filtered.forEach((r) => {
    if (!teacherMap[r.teacher_name]) {
      teacherMap[r.teacher_name] = {
        teacher_name: r.teacher_name,
        hours_count: 0,
        duties_count: 0,
        total_count: 0,
      };
    }
    if (r.type === 'DOZOR') {
      teacherMap[r.teacher_name].duties_count += 1;
    } else {
      teacherMap[r.teacher_name].hours_count += 1;
    }
    teacherMap[r.teacher_name].total_count += 1;
  });

  const summary = Object.values(teacherMap).sort((a, b) => {
    if (b.total_count !== a.total_count) return b.total_count - a.total_count;
    if (b.duties_count !== a.duties_count) return b.duties_count - a.duties_count;
    return a.teacher_name.localeCompare(b.teacher_name, 'cs');
  });

  let totalHours = 0;
  let totalDuties = 0;
  summary.forEach((s) => {
    totalHours += s.hours_count;
    totalDuties += s.duties_count;
  });

  return {
    success: true,
    startDate,
    endDate,
    summary,
    records: filtered,
    totals: {
      teachersCount: summary.length,
      totalHours,
      totalDuties,
      grandTotal: totalHours + totalDuties,
    },
    isLocalFallback: true,
  };
}

