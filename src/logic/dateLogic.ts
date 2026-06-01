const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

function toUtcDate(date: string | Date): Date {
  return new Date(`${normalizeDate(date)}T00:00:00.000Z`);
}

export function getTodayDateString(): string {
  return normalizeDate(new Date());
}

export function getTomorrowDateString(): string {
  const tomorrow = toUtcDate(getTodayDateString());
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  return normalizeDate(tomorrow);
}

export function getStartOfWeek(date: string | Date = new Date()): string {
  const normalizedDate = toUtcDate(date);
  const dayOfWeek = normalizedDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  normalizedDate.setUTCDate(normalizedDate.getUTCDate() + mondayOffset);

  return normalizeDate(normalizedDate);
}

export function getEndOfWeek(date: string | Date = new Date()): string {
  const weekEnd = toUtcDate(getStartOfWeek(date));
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  return normalizeDate(weekEnd);
}

export function getWeekDays(date: string | Date = new Date()): string[] {
  const weekStart = toUtcDate(getStartOfWeek(date));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart.getTime() + index * DAY_IN_MS);
    return normalizeDate(day);
  });
}

function addDays(date: string | Date, days: number): string {
  const targetDate = toUtcDate(date);
  targetDate.setUTCDate(targetDate.getUTCDate() + days);

  return normalizeDate(targetDate);
}

export function getNextWeekDays(date: string | Date = new Date()): string[] {
  return getWeekDays(addDays(getEndOfWeek(date), 1));
}

export function isNextWeek(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  if (!date) {
    return false;
  }

  const nextWeekDays = getNextWeekDays(referenceDate);
  const normalizedDate = normalizeDate(date);

  return normalizedDate >= nextWeekDays[0] && normalizedDate <= nextWeekDays[nextWeekDays.length - 1];
}

export function isAfterNextWeek(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  if (!date) {
    return false;
  }

  const nextWeekDays = getNextWeekDays(referenceDate);

  return normalizeDate(date) > nextWeekDays[nextWeekDays.length - 1];
}

export function isSameDay(dateA?: string | Date, dateB?: string | Date): boolean {
  if (!dateA || !dateB) {
    return false;
  }

  return normalizeDate(dateA) === normalizeDate(dateB);
}

export function isToday(date?: string | Date): boolean {
  return isSameDay(date, getTodayDateString());
}

export function isTomorrow(date?: string | Date): boolean {
  if (!date) {
    return false;
  }

  return isSameDay(date, getTomorrowDateString());
}

export function isPastDate(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  if (!date) {
    return false;
  }

  return normalizeDate(date) < normalizeDate(referenceDate);
}

export function isThisWeek(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  if (!date) {
    return false;
  }

  const normalizedDate = normalizeDate(date);

  return normalizedDate >= getStartOfWeek(referenceDate) && normalizedDate <= getEndOfWeek(referenceDate);
}

export function isBeforeToday(date?: string | Date): boolean {
  return isPastDate(date, getTodayDateString());
}

export function isWithinCurrentWeek(date?: string | Date): boolean {
  return isThisWeek(date, getTodayDateString());
}

export function isOverdue(dueDate?: string | Date, isCompleted = false): boolean {
  return Boolean(dueDate && isPastDate(dueDate) && !isCompleted);
}
