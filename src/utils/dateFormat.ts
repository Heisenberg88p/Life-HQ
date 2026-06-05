import { safeNormalizeDate } from '../logic/dateLogic';

const DEFAULT_DATE_FALLBACK = 'Kein Datum';

export function formatDateDisplay(value?: string | Date, fallback = DEFAULT_DATE_FALLBACK): string {
  const normalizedDate = safeNormalizeDate(value);

  if (!normalizedDate) {
    return fallback;
  }

  const [year, month, day] = normalizedDate.split('-');

  return `${day}.${month}.${year}`;
}
