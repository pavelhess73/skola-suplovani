/**
 * API client for interacting with Cloudflare Pages Functions (/api/stats, /api/upload, /api/auth)
 * Includes token authentication management and a localStorage fallback for local preview.
 */

const LOCAL_STORAGE_KEY = 'skola_suplovani_records_v1';
const LOCAL_STORAGE_ABSENCES_KEY = 'skola_suplovani_absences_v1';
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
  {
    date: '2026-10-27',
    teacher_name: 'Mgr. Novák Jan',
    original_teacher: 'PaedDr. Horák Tomáš',
    type: 'HODINA',
    hour_slot: '1.',
    subject: 'Matematika',
    classroom: 'U14 (2.A)',
  },
  {
    date: '2026-10-26',
    teacher_name: 'Ing. Černý Michal',
    original_teacher: 'Mgr. Dvořáková Petra',
    type: 'HODINA',
    hour_slot: '2.',
    subject: 'Fyzika',
    classroom: 'LAB-FYZ (3.B)',
  },
  {
    date: '2026-10-21',
    teacher_name: 'Mgr. Dvořáková Petra',
    original_teacher: 'Mgr. Novák Jan',
    type: 'HODINA',
    hour_slot: '3.',
    subject: 'Český jazyk',
    classroom: 'U08 (3.B)',
  },
  {
    date: '2026-10-20',
    teacher_name: 'PaedDr. Horák Tomáš',
    original_teacher: 'Ing. Černý Michal',
    type: 'HODINA',
    hour_slot: '4.',
    subject: 'Dějepis',
    classroom: 'U11 (1.A)',
  },
  {
    date: '2026-10-15',
    teacher_name: 'Mgr. Novák Jan',
    original_teacher: 'Mgr. Svobodová Jana',
    type: 'HODINA',
    hour_slot: '2.',
    subject: 'Matematika',
    classroom: 'U14 (2.A)',
  },
  {
    date: '2026-10-14',
    teacher_name: 'Mgr. Veselá Marie',
    original_teacher: 'Mgr. Dvořáková Petra',
    type: 'HODINA',
    hour_slot: '5.',
    subject: 'Anglický jazyk',
    classroom: 'U05 (2.B)',
  },
  {
    date: '2026-10-08',
    teacher_name: 'Ing. Černý Michal',
    original_teacher: 'Mgr. Veselá Marie',
    type: 'HODINA',
    hour_slot: '3.',
    subject: 'Informatika',
    classroom: 'LAB-INF (4.C)',
  },
  {
    date: '2026-10-02',
    teacher_name: 'Mgr. Dvořáková Petra',
    original_teacher: 'Mgr. Svobodová Jana',
    type: 'HODINA',
    hour_slot: '1.',
    subject: 'Český jazyk',
    classroom: 'U08 (3.B)',
  },
  {
    date: '2026-09-24',
    teacher_name: 'Mgr. Novák Jan',
    original_teacher: 'Ing. Černý Michal',
    type: 'HODINA',
    hour_slot: '2.',
    subject: 'Matematika',
    classroom: 'U14 (2.A)',
  },
  {
    date: '2026-09-18',
    teacher_name: 'PaedDr. Horák Tomáš',
    original_teacher: 'Mgr. Dvořáková Petra',
    type: 'HODINA',
    hour_slot: '4.',
    subject: 'Dějepis',
    classroom: 'U11 (1.A)',
  },
  {
    date: '2026-09-11',
    teacher_name: 'Mgr. Veselá Marie',
    original_teacher: 'Mgr. Svobodová Jana',
    type: 'HODINA',
    hour_slot: '3.',
    subject: 'Anglický jazyk',
    classroom: 'U05 (2.B)',
  },
];

export const SAMPLE_ABSENCES = [
  {
    id: 1,
    date: '2026-11-04',
    teacher_name: 'Mgr. Svobodová Jana',
    reason: 'Sick Day',
    time_range: 'Celý den',
  },
  {
    id: 2,
    date: '2026-11-04',
    teacher_name: 'Ing. Černý Michal',
    reason: 'Lékař',
    time_range: '1 - 3',
  },
  {
    id: 3,
    date: '2026-11-04',
    teacher_name: 'PaedDr. Horák Tomáš',
    reason: 'Školení',
    time_range: 'Celý den',
  },
  {
    id: 4,
    date: '2026-11-03',
    teacher_name: 'Mgr. Novák Jan',
    reason: 'Lékař',
    time_range: '1 - 2',
  },
  {
    id: 5,
    date: '2026-11-02',
    teacher_name: 'Ing. Černý Michal',
    reason: 'OČR',
    time_range: 'Celý den',
  },
  {
    id: 6,
    date: '2026-10-27',
    teacher_name: 'PaedDr. Horák Tomáš',
    reason: 'Nemoc',
    time_range: 'Celý den',
  },
  {
    id: 7,
    date: '2026-10-26',
    teacher_name: 'Mgr. Dvořáková Petra',
    reason: 'Lékař',
    time_range: '1 - 3',
  },
  {
    id: 8,
    date: '2026-10-21',
    teacher_name: 'Mgr. Novák Jan',
    reason: 'Školení',
    time_range: 'Celý den',
  },
  {
    id: 9,
    date: '2026-10-15',
    teacher_name: 'Mgr. Svobodová Jana',
    reason: 'Sick Day',
    time_range: 'Celý den',
  },
  {
    id: 10,
    date: '2026-10-14',
    teacher_name: 'Mgr. Dvořáková Petra',
    reason: 'Nemoc',
    time_range: 'Celý den',
  },
  {
    id: 11,
    date: '2026-10-08',
    teacher_name: 'Mgr. Veselá Marie',
    reason: 'Lékař',
    time_range: '2 - 4',
  },
  {
    id: 12,
    date: '2026-09-24',
    teacher_name: 'Ing. Černý Michal',
    reason: 'Nemoc',
    time_range: 'Celý den',
  },
  {
    id: 13,
    date: '2026-09-18',
    teacher_name: 'Mgr. Dvořáková Petra',
    reason: 'Lékař',
    time_range: '1 - 3',
  },
  {
    id: 14,
    date: '2026-09-11',
    teacher_name: 'Mgr. Svobodová Jana',
    reason: 'Sick Day',
    time_range: 'Celý den',
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

function getLocalAbsences() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ABSENCES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ABSENCES_KEY, JSON.stringify(SAMPLE_ABSENCES));
      return SAMPLE_ABSENCES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SAMPLE_ABSENCES;
  }
}

function saveLocalAbsences(absences) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ABSENCES_KEY, JSON.stringify(absences));
  } catch (e) {
    console.error('Failed to save absences to localStorage', e);
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

export async function uploadRecords(date, records, absences = []) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date, records, absences }),
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
    
    // Substitutions fallback
    const all = getLocalRecords();
    const filtered = all.filter((r) => r.date !== date);
    const updated = [...filtered, ...records];
    saveLocalRecords(updated);

    // Absences fallback
    const allAbsences = getLocalAbsences();
    const filteredAbsences = allAbsences.filter((a) => a.date !== date);
    const updatedAbsences = [...filteredAbsences, ...absences];
    saveLocalAbsences(updatedAbsences);

    return {
      success: true,
      message: `Úspěšně uloženo ${records.length} suplování a ${absences.length} absencí pro datum ${date} (režim prohlížeče).`,
      count: records.length,
      absencesCount: absences.length,
      date,
      isLocalFallback: true,
    };
  }
}

export async function updateAbsence(id, updatedFields) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/absences', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, ...updatedFields }),
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
    throw new Error(errData.error || `Chyba při úpravě absence (${response.status})`);
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('Backend /api/absences PUT failed, updating local storage:', err.message);

    const all = getLocalAbsences();
    let updatedRecord = null;
    const nextAbsences = all.map((a) => {
      if (a.id === id) {
        updatedRecord = { ...a, ...updatedFields };
        return updatedRecord;
      }
      return a;
    });

    saveLocalAbsences(nextAbsences);
    return {
      success: true,
      message: 'Záznam byl upraven (lokální režim).',
      record: updatedRecord,
      isLocalFallback: true,
    };
  }
}

export async function updateSubstitutionRecord(id, updatedFields) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/records', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, ...updatedFields }),
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
    throw new Error(errData.error || `Chyba při úpravě záznamu (${response.status})`);
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('Backend /api/records PUT failed, updating local storage:', err.message);

    const all = getLocalRecords();
    let updatedRecord = null;
    const nextRecords = all.map((r) => {
      if (r.id === id) {
        updatedRecord = { ...r, ...updatedFields };
        return updatedRecord;
      }
      return r;
    });

    saveLocalRecords(nextRecords);
    return {
      success: true,
      message: 'Záznam byl upraven (lokální režim).',
      record: updatedRecord,
      isLocalFallback: true,
    };
  }
}

export async function deleteSubstitutionRecord(id) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`/api/records?id=${id}`, {
      method: 'DELETE',
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

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Chyba při mazání záznamu (${response.status})`);
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('Backend /api/records DELETE failed, removing from local storage:', err.message);

    const all = getLocalRecords();
    const nextRecords = all.filter((r) => r.id !== id);
    saveLocalRecords(nextRecords);

    return {
      success: true,
      message: 'Záznam byl smazán (lokální režim).',
      id,
      isLocalFallback: true,
    };
  }
}

export async function deleteAbsence(id) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`/api/absences?id=${id}`, {
      method: 'DELETE',
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

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Chyba při mazání absence (${response.status})`);
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('Backend /api/absences DELETE failed, removing from local storage:', err.message);

    const all = getLocalAbsences();
    const nextAbsences = all.filter((a) => a.id !== id);
    saveLocalAbsences(nextAbsences);

    return {
      success: true,
      message: 'Záznam byl smazán (lokální režim).',
      id,
      isLocalFallback: true,
    };
  }
}

function getLocalStatsMock(startDate, endDate) {
  const allRecords = getLocalRecords();
  const filteredRecords = allRecords.filter((r) => r.date >= startDate && r.date <= endDate);

  const teacherMap = {};
  filteredRecords.forEach((r) => {
    if (!teacherMap[r.teacher_name]) {
      teacherMap[r.teacher_name] = {
        teacher_name: r.teacher_name,
        hours_count: 0,
        duties_count: 0,
        replacements_count: 0,
        total_count: 0,
      };
    }
    if (r.type === 'DOZOR') {
      teacherMap[r.teacher_name].duties_count += 1;
      teacherMap[r.teacher_name].total_count += 1;
    } else if (r.is_replacement === 1) {
      teacherMap[r.teacher_name].replacements_count += 1;
      // Excluded from hours_count and total_count!
    } else {
      teacherMap[r.teacher_name].hours_count += 1;
      teacherMap[r.teacher_name].total_count += 1;
    }
  });

  const summary = Object.values(teacherMap).sort((a, b) => {
    if (b.total_count !== a.total_count) return b.total_count - a.total_count;
    if (b.duties_count !== a.duties_count) return b.duties_count - a.duties_count;
    return a.teacher_name.localeCompare(b.teacher_name, 'cs');
  });

  let totalHours = 0;
  let totalDuties = 0;
  let totalReplacements = 0;
  summary.forEach((s) => {
    totalHours += s.hours_count;
    totalDuties += s.duties_count;
    totalReplacements += s.replacements_count || 0;
  });

  // Absences mock
  const allAbsences = getLocalAbsences();
  const filteredAbsences = allAbsences.filter((a) => a.date >= startDate && a.date <= endDate);

  const reasonMap = {};
  const teacherAbsenceMap = {};
  filteredAbsences.forEach((a) => {
    reasonMap[a.reason] = (reasonMap[a.reason] || 0) + 1;
    teacherAbsenceMap[a.teacher_name] = (teacherAbsenceMap[a.teacher_name] || 0) + 1;
  });

  const byReason = Object.entries(reasonMap).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  const byTeacher = Object.entries(teacherAbsenceMap).map(([teacher_name, count]) => ({ teacher_name, count })).sort((a, b) => b.count - a.count);

  return {
    success: true,
    startDate,
    endDate,
    summary,
    records: filteredRecords,
    absences: filteredAbsences,
    absenceSummary: {
      totalAbsences: filteredAbsences.length,
      byReason,
      byTeacher,
    },
    totals: {
      teachersCount: summary.length,
      totalHours,
      totalDuties,
      grandTotal: totalHours + totalDuties,
      totalAbsences: filteredAbsences.length,
    },
    isLocalFallback: true,
  };
}

export async function fetchFairPlayRecommendations(startDate, endDate, month) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  try {
    const response = await fetch(`/api/fairplay?${params.toString()}`, {
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
    console.warn('API fairplay unavailable, fallback to local mock data:', err.message);
    return getLocalFairPlayMock(startDate, endDate, month);
  }
}

export async function fetchAnalytics(startDate, endDate) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetch(`/api/analytics${queryStr}`, {
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
    console.warn('API analytics unavailable, fallback to local mock data:', err.message);
    return getLocalAnalyticsMock(startDate, endDate);
  }
}

function getLocalFairPlayMock(startDate, endDate, month) {
  let start = startDate;
  let end = endDate;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    start = `${month}-01`;
    const [year, m] = month.split('-').map(Number);
    const lastDay = new Date(year, m, 0).getDate();
    end = `${month}-${String(lastDay).padStart(2, '0')}`;
  } else if (!start || !end) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(currentYear, now.getMonth() + 1, 0).getDate();
    start = `${currentYear}-${currentMonth}-01`;
    end = `${currentYear}-${currentMonth}-${String(lastDay).padStart(2, '0')}`;
  }

  const allRecords = getLocalRecords();
  const allAbsences = getLocalAbsences();

  // Find all distinct teacher names across all time
  const teacherNames = new Set([
    ...allRecords.map((r) => r.teacher_name).filter(Boolean),
    ...allAbsences.map((a) => a.teacher_name).filter(Boolean),
  ]);

  const teacherMap = {};
  teacherNames.forEach((name) => {
    teacherMap[name] = {
      teacher_name: name,
      hours_count: 0,
      duties_count: 0,
      replacements_count: 0,
      total_count: 0,
    };
  });

  const periodRecords = allRecords.filter((r) => r.date >= start && r.date <= end);
  periodRecords.forEach((r) => {
    if (!teacherMap[r.teacher_name]) {
      teacherMap[r.teacher_name] = {
        teacher_name: r.teacher_name,
        hours_count: 0,
        duties_count: 0,
        replacements_count: 0,
        total_count: 0,
      };
    }
    if (r.type === 'DOZOR') {
      teacherMap[r.teacher_name].duties_count += 1;
      teacherMap[r.teacher_name].total_count += 1;
    } else if (r.is_replacement === 1) {
      teacherMap[r.teacher_name].replacements_count += 1;
    } else {
      teacherMap[r.teacher_name].hours_count += 1;
      teacherMap[r.teacher_name].total_count += 1;
    }
  });

  const teachers = Object.values(teacherMap);

  const byDuties = [...teachers].sort((a, b) => {
    if (a.duties_count !== b.duties_count) return a.duties_count - b.duties_count;
    if (a.total_count !== b.total_count) return a.total_count - b.total_count;
    return a.teacher_name.localeCompare(b.teacher_name, 'cs');
  });

  const byHours = [...teachers].sort((a, b) => {
    if (a.hours_count !== b.hours_count) return a.hours_count - b.hours_count;
    if (a.total_count !== b.total_count) return a.total_count - b.total_count;
    return a.teacher_name.localeCompare(b.teacher_name, 'cs');
  });

  const byTotal = [...teachers].sort((a, b) => {
    if (a.total_count !== b.total_count) return a.total_count - b.total_count;
    if (a.duties_count !== b.duties_count) return a.duties_count - b.duties_count;
    return a.teacher_name.localeCompare(b.teacher_name, 'cs');
  });

  return {
    success: true,
    startDate: start,
    endDate: end,
    totalTeachers: teachers.length,
    byDuties,
    byHours,
    byTotal,
    topRecommendations: {
      duty: byDuties.slice(0, 3),
      substitution: byHours.slice(0, 3),
      fairplay: byTotal.slice(0, 3),
    },
    isLocalFallback: true,
  };
}

function getLocalAnalyticsMock(startDate, endDate) {
  const start = startDate || '2000-01-01';
  const end = endDate || '2099-12-31';

  const allRecords = getLocalRecords();
  const allAbsences = getLocalAbsences();

  const filteredRecords = allRecords.filter((r) => r.date >= start && r.date <= end);
  const filteredAbsences = allAbsences.filter((a) => a.date >= start && a.date <= end);

  // Weekly absences timeline
  const weekMap = {};
  filteredAbsences.forEach((a) => {
    const d = new Date(a.date);
    const firstJan = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - firstJan) / (24 * 60 * 60 * 1000));
    const weekNum = String(Math.ceil((days + firstJan.getDay() + 1) / 7)).padStart(2, '0');
    const period = `${d.getFullYear()}-W${weekNum}`;

    if (!weekMap[period]) {
      weekMap[period] = {
        period,
        sample_date: a.date,
        total_absences: 0,
        sickness_count: 0,
        doctor_count: 0,
        training_count: 0,
        family_care_count: 0,
      };
    }
    weekMap[period].total_absences += 1;
    const rLower = (a.reason || '').toLowerCase();
    if (rLower.includes('sick') || rLower.includes('nemoc')) weekMap[period].sickness_count += 1;
    else if (rLower.includes('lékař') || rLower.includes('lekar')) weekMap[period].doctor_count += 1;
    else if (rLower.includes('školení') || rLower.includes('skoleni')) weekMap[period].training_count += 1;
    else if (rLower.includes('očr') || rLower.includes('ocr')) weekMap[period].family_care_count += 1;
  });

  const weeklyTimeline = Object.values(weekMap).sort((a, b) => a.period.localeCompare(b.period));

  // Monthly absences timeline
  const monthMap = {};
  filteredAbsences.forEach((a) => {
    const period = a.date.slice(0, 7);
    if (!monthMap[period]) {
      monthMap[period] = {
        period,
        total_absences: 0,
        sickness_count: 0,
        doctor_count: 0,
      };
    }
    monthMap[period].total_absences += 1;
    const rLower = (a.reason || '').toLowerCase();
    if (rLower.includes('sick') || rLower.includes('nemoc')) monthMap[period].sickness_count += 1;
    else if (rLower.includes('lékař') || rLower.includes('lekar')) monthMap[period].doctor_count += 1;
  });

  const monthlyTimeline = Object.values(monthMap).sort((a, b) => a.period.localeCompare(b.period));

  // Top 5 subjects
  const subjectMap = {};
  filteredRecords
    .filter((r) => r.type === 'HODINA' && r.subject && r.subject.trim())
    .forEach((r) => {
      const s = r.subject.trim();
      subjectMap[s] = (subjectMap[s] || 0) + 1;
    });

  const topSubjects = Object.entries(subjectMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top 5 classrooms / classes
  const classroomMap = {};
  filteredRecords
    .filter((r) => r.classroom && r.classroom.trim())
    .forEach((r) => {
      const c = r.classroom.trim();
      classroomMap[c] = (classroomMap[c] || 0) + 1;
    });

  const topClassrooms = Object.entries(classroomMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top reasons
  const reasonMap = {};
  filteredAbsences.forEach((a) => {
    const r = (a.reason || 'Neuvedeno').trim();
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  });

  const topReasons = Object.entries(reasonMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    success: true,
    startDate: start,
    endDate: end,
    weeklyTimeline,
    monthlyTimeline,
    topSubjects,
    topClassrooms,
    topReasons,
    isLocalFallback: true,
  };
}
