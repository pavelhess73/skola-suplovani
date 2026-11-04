import * as XLSX from 'xlsx';

/**
 * Normalizes text for header detection by removing diacritics and converting to lowercase
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extracts date from top rows (first 5 rows) of EduPage export.
 * Supports formats like "Středa 04. 11. 2026", "4. 11. 2026", "04.11.2026", "2026-11-04".
 */
export function extractDateFromRows(rows) {
  const topRows = rows.slice(0, 5);

  const czDateRegex = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/;
  const isoDateRegex = /(\d{4})-(\d{1,2})-(\d{1,2})/;

  for (const row of topRows) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (!cell) continue;
      const cellText = String(cell).trim();

      const czMatch = cellText.match(czDateRegex);
      if (czMatch) {
        const day = czMatch[1].padStart(2, '0');
        const month = czMatch[2].padStart(2, '0');
        const year = czMatch[3];
        return `${year}-${month}-${day}`;
      }

      const isoMatch = cellText.match(isoDateRegex);
      if (isoMatch) {
        const year = isoMatch[1];
        const month = isoMatch[2].padStart(2, '0');
        const day = isoMatch[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

/**
 * Parses the "Chybějící" sheet for absent teachers.
 */
export function parseAbsencesFromSheet(sheet, dateIso) {
  if (!sheet) return [];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length === 0) return [];

  let headerRowIndex = -1;
  let colIndexes = {
    teacher: -1,
    reason: -1,
    timeRange: -1,
  };

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    const currentCols = { teacher: -1, reason: -1, timeRange: -1 };

    row.forEach((cell, c) => {
      const norm = normalizeText(cell);
      // Skip title rows that contain years or are long titles
      if (norm.includes('202') || norm.length > 35) return;

      if (
        norm === 'chybejici' || 
        norm === 'ucitel' || 
        norm === 'kdo' || 
        norm === 'jmeno' || 
        norm.includes('chybejici ucitel')
      ) {
        currentCols.teacher = c;
      } else if (norm.includes('duvod') || norm === 'typ') {
        currentCols.reason = c;
      } else if (norm === 'kdy' || norm === 'doba' || norm === 'cas' || norm === 'rozsah' || norm.includes('hodin')) {
        currentCols.timeRange = c;
      }
    });

    if (currentCols.teacher !== -1 && (currentCols.reason !== -1 || currentCols.timeRange !== -1)) {
      headerRowIndex = r;
      colIndexes = currentCols;
      break;
    }
  }

  // Fallback: search for exact cell "chybejici" or "kdo"
  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const idx = row.findIndex((c) => {
        const norm = normalizeText(c);
        return (norm === 'chybejici' || norm === 'kdo' || norm === 'ucitel') && !norm.includes('202');
      });
      if (idx !== -1) {
        headerRowIndex = r;
        colIndexes.teacher = idx;
        row.forEach((cell, c) => {
          const norm = normalizeText(cell);
          if (norm.includes('duvod')) colIndexes.reason = c;
          if (norm === 'kdy' || norm.includes('doba') || norm.includes('cas')) colIndexes.timeRange = c;
        });
        break;
      }
    }
  }

  if (headerRowIndex === -1 || colIndexes.teacher === -1) {
    return [];
  }

  const absences = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const teacherRaw = String(row[colIndexes.teacher] || '').trim();
    if (!teacherRaw || teacherRaw === '-' || teacherRaw === '/') continue;

    // Skip repeated header line
    const normTeacher = normalizeText(teacherRaw);
    if (normTeacher === 'chybejici' || normTeacher === 'kdo' || normTeacher === 'ucitel') continue;

    const reasonRaw = colIndexes.reason !== -1 ? String(row[colIndexes.reason] || '').trim() : '';
    const timeRaw = colIndexes.timeRange !== -1 ? String(row[colIndexes.timeRange] || '').trim() : '';

    absences.push({
      date: dateIso,
      teacher_name: teacherRaw,
      reason: reasonRaw || 'Neurčeno',
      time_range: timeRaw || 'Celý den',
    });
  }

  return absences;
}

/**
 * Parses EduPage substitution Excel sheet.
 * @param {ArrayBuffer | Uint8Array} fileData
 * @returns {Promise<{ date: string, dateFormatted: string, sheetName: string, records: Array, absences: Array }>}
 */
export async function parseEdupageExcel(fileData) {
  const workbook = XLSX.read(fileData, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Soubor neobsahuje žádné listy.');
  }

  // Identify sheets: "Suplování" vs "Chybějící"
  let mainSheetName = workbook.SheetNames[0];
  let absenceSheetName = null;

  for (const name of workbook.SheetNames) {
    const norm = normalizeText(name);
    if (norm.includes('chybej') || norm.includes('absenc')) {
      absenceSheetName = name;
    } else if (norm.includes('supl')) {
      mainSheetName = name;
    }
  }

  const sheet = workbook.Sheets[mainSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error(`List "${mainSheetName}" v sešitu je prázdný.`);
  }

  // 1. Extract date from header (first 5 rows of primary sheet or first sheet)
  let dateIso = extractDateFromRows(rawRows);
  if (!dateIso && absenceSheetName) {
    const absenceRows = XLSX.utils.sheet_to_json(workbook.Sheets[absenceSheetName], { header: 1, defval: '' });
    dateIso = extractDateFromRows(absenceRows);
  }

  if (!dateIso) {
    throw new Error('V prvních 5 řádcích souboru se nepodařilo nalézt platné datum (např. "04. 11. 2026").');
  }

  // Format date for display (DD. MM. YYYY)
  const [year, month, day] = dateIso.split('-');
  const dateFormatted = `${day}. ${month}. ${year}`;

  // 2. Identify header row for substitutions
  let headerRowIndex = -1;
  let colIndexes = {
    hour: -1,
    subject: -1,
    classroom: -1,
    classGroup: -1,
    missing: -1,
    substituting: -1,
    type: -1,
    note: -1,
  };

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    let hasSuplujici = false;
    let hasChybejiciOrPredmet = false;

    row.forEach((cell, c) => {
      const norm = normalizeText(cell);
      if (norm.includes('suplujic') || norm.includes('zastupujic') || norm === 'kdo') {
        hasSuplujici = true;
      }
      if (norm.includes('chybeji') || norm.includes('predmet') || norm.includes('hodin')) {
        hasChybejiciOrPredmet = true;
      }
    });

    if (hasSuplujici && hasChybejiciOrPredmet) {
      headerRowIndex = r;
      row.forEach((cell, c) => {
        const norm = normalizeText(cell);
        if (norm.includes('hodin')) colIndexes.hour = c;
        else if (norm.includes('predmet')) colIndexes.subject = c;
        else if (norm.includes('ucebn') || norm.includes('mistnost')) colIndexes.classroom = c;
        else if (norm.includes('trid')) colIndexes.classGroup = c;
        else if (norm.includes('chybeji') || norm.includes('koho')) colIndexes.missing = c;
        else if (norm.includes('suplujic') || norm.includes('zastupujic') || norm === 'kdo') colIndexes.substituting = c;
        else if (norm === 'typ' || norm.includes('duvod')) colIndexes.type = c;
        else if (norm.includes('poznamk') || norm.includes('informac')) colIndexes.note = c;
      });
      break;
    }
  }

  // Fallback: If header row wasn't found by explicit names, search for any row with "suplující"
  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const idx = row.findIndex((c) => normalizeText(c).includes('supluj'));
      if (idx !== -1) {
        headerRowIndex = r;
        colIndexes.substituting = idx;
        break;
      }
    }
  }

  if (headerRowIndex === -1 || colIndexes.substituting === -1) {
    throw new Error('V tabulce nebyl nalezen sloupec se suplujícím učitelem ("Suplující"). Zkontrolujte formát exportu.');
  }

  // 3. Process records from headerRowIndex + 1
  const records = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const teacherRaw = colIndexes.substituting !== -1 ? String(row[colIndexes.substituting] || '').trim() : '';
    
    if (!teacherRaw || teacherRaw === '-' || teacherRaw === '/' || normalizeText(teacherRaw) === 'odpada') {
      continue;
    }

    const originalTeacher = colIndexes.missing !== -1 ? String(row[colIndexes.missing] || '').trim() : '';
    const hourSlot = colIndexes.hour !== -1 ? String(row[colIndexes.hour] || '').trim() : '';
    const subject = colIndexes.subject !== -1 ? String(row[colIndexes.subject] || '').trim() : '';
    
    let classroom = colIndexes.classroom !== -1 ? String(row[colIndexes.classroom] || '').trim() : '';
    if (!classroom && colIndexes.classGroup !== -1) {
      classroom = String(row[colIndexes.classGroup] || '').trim();
    }

    const typeCol = colIndexes.type !== -1 ? String(row[colIndexes.type] || '').trim() : '';
    const noteCol = colIndexes.note !== -1 ? String(row[colIndexes.note] || '').trim() : '';

    const combinedTypeInfo = normalizeText(`${typeCol} ${subject} ${noteCol}`);
    const isDozor = combinedTypeInfo.includes('dohled') || combinedTypeInfo.includes('dozor');
    const recordType = isDozor ? 'DOZOR' : 'HODINA';

    records.push({
      date: dateIso,
      teacher_name: teacherRaw,
      original_teacher: originalTeacher || null,
      type: recordType,
      hour_slot: hourSlot || null,
      subject: subject || null,
      classroom: classroom || null,
    });
  }

  // 4. Parse absences if "Chybějící" sheet exists
  let absences = [];
  if (absenceSheetName && workbook.Sheets[absenceSheetName]) {
    absences = parseAbsencesFromSheet(workbook.Sheets[absenceSheetName], dateIso);
  }

  return {
    date: dateIso,
    dateFormatted,
    sheetName: mainSheetName,
    records,
    absences,
  };
}
