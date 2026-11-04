/**
 * Utility functions for school date calculations and Czech date formatting
 */

export function formatDateToIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoToCzech(isoString) {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const [y, m, d] = parts;
  return `${parseInt(d, 10)}. ${parseInt(m, 10)}. ${y}`;
}

/**
 * Returns date range for "Tento týden" (Monday - Friday)
 */
export function getThisWeekRange(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday ...
  
  // Calculate difference to Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    startDate: formatDateToIso(monday),
    endDate: formatDateToIso(friday),
    label: 'Tento týden (Po–Pá)',
  };
}

/**
 * Returns date range for "Tento měsíc"
 */
export function getThisMonthRange(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);

  return {
    startDate: formatDateToIso(firstDay),
    endDate: formatDateToIso(lastDay),
    label: 'Tento měsíc',
  };
}

/**
 * Returns date range for "Školní rok" (1. září - 30. června)
 */
export function getSchoolYearRange(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const year = current.getFullYear();
  const month = current.getMonth(); // 0 = Jan, 8 = Sep

  let startYear = year;
  let endYear = year + 1;

  // If before September, school year started last calendar year
  if (month < 8) {
    startYear = year - 1;
    endYear = year;
  }

  const start = `${startYear}-09-01`;
  const end = `${endYear}-06-30`;

  return {
    startDate: start,
    endDate: end,
    label: `Školní rok ${startYear}/${endYear}`,
  };
}

