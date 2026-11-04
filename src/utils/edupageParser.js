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

  // Regex for Czech date: D. M. YYYY or DD. MM. YYYY
  const czDateRegex = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/;
  // Regex for ISO date: YYYY-MM-DD
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
 * Parses EduPage substitution Excel sheet.
 * @param {ArrayBuffer | Uint8Array} fileData
 * @returns {Promise<{ date: string, dateFormatted: string, records: Array }>}
 */
export async function parseEdupageExcel(fileData) {
  const workbook = XLSX.read(fileData, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Soubor neobsahuje žádné listy.');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('List v sešitu je prázdný.');
  }

  // 1. Extract date from header (first 5 rows)
  const dateIso = extractDateFromRows(rawRows);
  if (!dateIso) {
    throw new Error('V prvních 5 řádcích souboru se nepodařilo nalézt platné datum (např. "04. 11. 2026").');
  }

  // Format date for display (DD. MM. YYYY)
  const [year, month, day] = dateIso.split('-');
  const dateFormatted = `${day}. ${month}. ${year}`;

  // 2. Identify header row
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
      // Map columns
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
      const idx = row.findIndex(c => normalizeText(c).includes('supluj'));
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
    
    // Ignore rows where substituting teacher is empty or invalid
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

    // Determine type: DOZOR if "Typ" or "Předmět" or note contains "Dohled" / "Dozor"
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

  return {
    date: dateIso,
    dateFormatted,
    sheetName,
    records,
  };
}

