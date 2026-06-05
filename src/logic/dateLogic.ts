const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function isValidDateString(value: string): boolean {
  if (!DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const localDate = new Date(year, month - 1, day);

  return (
    localDate.getFullYear() === year &&
    localDate.getMonth() === month - 1 &&
    localDate.getDate() === day
  );
}

export function safeNormalizeDate(date?: string | Date): string | undefined {
  if (!date) {
    return undefined;
  }

  if (typeof date === 'string' && DATE_ONLY_REGEX.test(date)) {
    return isValidDateString(date) ? date : undefined;
  }

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return formatLocalDate(parsedDate);
}

export function normalizeDate(date: string | Date): string {
  return safeNormalizeDate(date) ?? '';
}

function toLocalDate(date: string | Date): Date | undefined {
  const normalizedDate = safeNormalizeDate(date);

  if (!normalizedDate) {
    return undefined;
  }

  const [yearPart, monthPart, dayPart] = normalizedDate.split('-');

  return new Date(Number(yearPart), Number(monthPart) - 1, Number(dayPart));
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function getTomorrowDateString(): string {
  const tomorrow = toLocalDate(getTodayDateString()) ?? new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return formatLocalDate(tomorrow);
}

export function getStartOfWeek(date: string | Date = new Date()): string {
  const normalizedDate = toLocalDate(date) ?? toLocalDate(getTodayDateString()) ?? new Date();
  const dayOfWeek = normalizedDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  normalizedDate.setDate(normalizedDate.getDate() + mondayOffset);

  return formatLocalDate(normalizedDate);
}

export function getEndOfWeek(date: string | Date = new Date()): string {
  const weekEnd = toLocalDate(getStartOfWeek(date)) ?? new Date();
  weekEnd.setDate(weekEnd.getDate() + 6);

  return formatLocalDate(weekEnd);
}

export function getWeekDays(date: string | Date = new Date()): string[] {
  const weekStart = toLocalDate(getStartOfWeek(date)) ?? new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart.getTime() + index * DAY_IN_MS);
    return formatLocalDate(day);
  });
}

function addDays(date: string | Date, days: number): string {
  const targetDate = toLocalDate(date) ?? new Date();
  targetDate.setDate(targetDate.getDate() + days);

  return formatLocalDate(targetDate);
}

export function getNextWeekDays(date: string | Date = new Date()): string[] {
  return getWeekDays(addDays(getEndOfWeek(date), 1));
}

export function isNextWeek(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  const normalizedDate = safeNormalizeDate(date);
  const normalizedReferenceDate = safeNormalizeDate(referenceDate);

  if (!normalizedDate || !normalizedReferenceDate) {
    return false;
  }

  const nextWeekDays = getNextWeekDays(normalizedReferenceDate);

  return normalizedDate >= nextWeekDays[0] && normalizedDate <= nextWeekDays[nextWeekDays.length - 1];
}

export function isAfterNextWeek(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  const normalizedDate = safeNormalizeDate(date);
  const normalizedReferenceDate = safeNormalizeDate(referenceDate);

  if (!normalizedDate || !normalizedReferenceDate) {
    return false;
  }

  const nextWeekDays = getNextWeekDays(normalizedReferenceDate);

  return normalizedDate > nextWeekDays[nextWeekDays.length - 1];
}

export function isSameDay(dateA?: string | Date, dateB?: string | Date): boolean {
  const normalizedDateA = safeNormalizeDate(dateA);
  const normalizedDateB = safeNormalizeDate(dateB);

  if (!normalizedDateA || !normalizedDateB) {
    return false;
  }

  return normalizedDateA === normalizedDateB;
}

export function isToday(date?: string | Date): boolean {
  return isSameDay(date, getTodayDateString());
}

export function isTomorrow(date?: string | Date): boolean {
  return isSameDay(date, getTomorrowDateString());
}

export function isPastDate(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  const normalizedDate = safeNormalizeDate(date);
  const normalizedReferenceDate = safeNormalizeDate(referenceDate);

  if (!normalizedDate || !normalizedReferenceDate) {
    return false;
  }

  return normalizedDate < normalizedReferenceDate;
}

export function isThisWeek(date?: string | Date, referenceDate: string | Date = new Date()): boolean {
  const normalizedDate = safeNormalizeDate(date);
  const normalizedReferenceDate = safeNormalizeDate(referenceDate);

  if (!normalizedDate || !normalizedReferenceDate) {
    return false;
  }

  return normalizedDate >= getStartOfWeek(normalizedReferenceDate) && normalizedDate <= getEndOfWeek(normalizedReferenceDate);
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
