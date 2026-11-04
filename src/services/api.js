/**
 * API client for interacting with Cloudflare Pages Functions (/api/stats, /api/upload, /api/auth)
 * Includes token authentication management and a localStorage fallback for local preview.
 */

const LOCAL_STORAGE_KEY = 'skola_suplovani_records_v1';
const AUTH_TOKEN_KEY = 'edu_auth_token';
const DEFAULT_PASSWORD = 'skola2026';

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

// --- Authentication Helpers ---

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || null;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function login(password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.token) {
      setAuthToken(data.token);
      return { success: true, token: data.token };
    }

    if (res.status === 401) {
      throw new Error(data.error || 'Nesprávné přihlašovací heslo.');
    }

    throw new Error(data.error || `Chyba při přihlašování (${res.status})`);
  } catch (err) {
    // If backend endpoint is unavailable (e.g. pure Vite dev without Wrangler backend)
    if (err.message.includes('Nesprávné přihlašovací heslo')) {
      throw err;
    }
    console.warn('Backend /api/auth nedostupný, provádím lokální validaci hesla:', err.message);
    if (password === DEFAULT_PASSWORD) {
      const mockToken = 'mock_token_' + btoa(password + ':edu_suplovani_2026');
      setAuthToken(mockToken);
      return { success: true, token: mockToken, isLocalFallback: true };
    }
    throw new Error('Nesprávné přihlašovací heslo.');
  }
}

export async function verifyToken(token) {
  if (!token) return false;
  try {
    const res = await fetch('/api/auth', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
    if (res.status === 401) {
      clearAuthToken();
      return false;
    }
    return true;
  } catch (e) {
    // In local fallback mode
    return token.startsWith('mock_token_') || token.length > 20;
  }
}

// --- Data API ---

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
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`/api/stats?startDate=${startDate}&endDate=${endDate}`, {
      headers,
    });

    if (response.status === 401) {
      clearAuthToken();
      const err = new Error('Platnost přihlášení vypršela. Přihlaste se prosím znovu.');
      err.isAuthError = true;
      throw err;
    }

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`Server returned ${response.status}`);
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('API stats unavailable, fallback to local mock data:', err.message);
    return getLocalStatsMock(startDate, endDate);
  }
}

export async function uploadRecords(date, records) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date, records }),
    });

    if (response.status === 401) {
      clearAuthToken();
      const err = new Error('Platnost přihlášení vypršela. Přihlaste se prosím znovu.');
      err.isAuthError = true;
      throw err;
    }

    if (response.ok) {
      return await response.json();
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server vrátil kód ${response.status}`);
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('Backend /api/upload failed, persisting to local storage:', err.message);
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
