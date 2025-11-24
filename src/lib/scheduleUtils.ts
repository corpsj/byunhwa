/**
 * Parse and format schedule time strings
 * Centralizes schedule parsing logic to avoid duplication
 */

export const formatSchedule = (value: string | null | undefined, withPadding = true) => {
  if (!value) return '';

  const match = value.match(/(\d{1,2})월\s*(\d{1,2})일.*?(\d{1,2}):(\d{2})/);
  if (!match) return value;

  const [, mmStr, ddStr, hhStr, minStr] = match;
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  const hh = Number(hhStr);
  const minutes = Number(minStr);
  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = new Date().getFullYear();
  const d = new Date(`${year}-${pad(mm)}-${pad(dd)}T${pad(hh)}:${pad(minutes)}`);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayPart = Number.isNaN(d.getTime()) ? '' : ` (${dayNames[d.getDay()]})`;

  // Return with or without padding based on parameter
  if (withPadding) {
    return `${pad(mm)}월 ${pad(dd)}일${dayPart} ${pad(hh)}:${pad(minutes)}`;
  }
  return `${mm}월 ${dd}일${dayPart} ${pad(hh)}:${pad(minutes)}`;
};

/**
 * Extract date components from schedule string
 */
export const parseScheduleDate = (scheduleTime: string) => {
  const match = scheduleTime.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (!match) return null;

  const year = new Date().getFullYear();
  const month = Number(match[1]) - 1; // 0-indexed
  const day = Number(match[2]);

  return new Date(year, month, day);
};

/**
 * Check if a schedule matches a specific date
 */
export const isScheduleOnDate = (scheduleTime: string, targetDate: Date) => {
  const scheduleDate = parseScheduleDate(scheduleTime);
  if (!scheduleDate) return false;

  return (
    scheduleDate.getFullYear() === targetDate.getFullYear() &&
    scheduleDate.getMonth() === targetDate.getMonth() &&
    scheduleDate.getDate() === targetDate.getDate()
  );
};

/**
 * Extract time string from schedule
 * Example: "12월 25일 (수) 14:00" -> "14:00"
 */
export const getScheduleTimeString = (scheduleTime: string) => {
  const match = scheduleTime.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : scheduleTime;
};
