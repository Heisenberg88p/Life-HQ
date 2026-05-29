const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDate(date: string | Date): string {
  if (typeof date === 'string' && DATE_ONLY_REGEX.test(date)) {
    return date;
  }

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date value provided to normalizeDate');
  }

  return parsedDate.toISOString().slice(0, 10);
}

export function getTodayDateString(): string {
  return normalizeDate(new Date());
}

export function isSameDay(dateA?: string, dateB?: string): boolean {
  if (!dateA || !dateB) {
    return false;
  }

  return normalizeDate(dateA) === normalizeDate(dateB);
}

export function isBeforeToday(date?: string): boolean {
  if (!date) {
    return false;
  }

  return normalizeDate(date) < getTodayDateString();
}

export function isWithinCurrentWeek(date?: string): boolean {
  if (!date) {
    return false;
  }

  const target = new Date(normalizeDate(date));
  const today = new Date(getTodayDateString());

  const dayOfWeek = today.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return target >= weekStart && target <= weekEnd;
}
