/**
 * Formats a shift display name like "28/07/2026 Tue 07:00-12:00"
 */
export function formatShiftDisplayName(
  recordDate: string,
  shiftTimeStart: string,
  shiftTimeEnd: string,
): string {
  const [year, month, day] = recordDate.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[date.getDay()];
  return `${parseInt(day)}/${month}/${year} ${dayName} ${shiftTimeStart}-${shiftTimeEnd}`;
}

/**
 * Formats a filename-safe date like "27-08-2026_Thu_0700_1200"
 */
export function formatExportFilename(
  recordDate: string,
  shiftTimeStart: string,
  shiftTimeEnd: string,
): string {
  const [year, month, day] = recordDate.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayStr = `${parseInt(day)}-${month}-${year}`;
  const dayName = days[date.getDay()];
  const timeStart = shiftTimeStart.replace(":", "");
  const timeEnd = shiftTimeEnd.replace(":", "");
  return `${dayStr}_${dayName}_${timeStart}_${timeEnd}`;
}
