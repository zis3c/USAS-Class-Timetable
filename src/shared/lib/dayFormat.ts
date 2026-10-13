const MALAY_DAYS = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'] as const;

export const WEEKDAY_ORDER = [...MALAY_DAYS] as string[];

const EN_DAY_MAP: Record<string, string> = {
  MONDAY: 'ISNIN',
  TUESDAY: 'SELASA',
  WEDNESDAY: 'RABU',
  THURSDAY: 'KHAMIS',
  FRIDAY: 'JUMAAT',
  SATURDAY: 'SABTU',
  SUNDAY: 'AHAD',
  MON: 'ISNIN',
  TUE: 'SELASA',
  WED: 'RABU',
  THU: 'KHAMIS',
  FRI: 'JUMAAT',
  SAT: 'SABTU',
  SUN: 'AHAD',
};

/** Strips the backend's "days." / "shortdays." prefix, keeping the embedded date and day name. */
export function stripDayPrefix(dayStr?: string): string {
  return String(dayStr ?? '').replace(/^(?:short)?days\./i, '').trim();
}

/** Strips the prefix and uppercases to match the app's fixed day keys. */
export function normalizeDayLabel(dayStr?: string): string {
  return stripDayPrefix(dayStr).toUpperCase();
}

/** Extracts the Malay day key from labels like "days.05-10-2026 (ISNIN)", "ISNI", or "MONDAY". */
export function extractDayName(dayStr?: string): string {
  if (!dayStr) return '';
  const clean = stripDayPrefix(dayStr).toUpperCase();

  for (const d of MALAY_DAYS) {
    if (clean === d) return d;
  }

  for (const d of MALAY_DAYS) {
    // Backend may truncate the day name (e.g. 'ISNI'), so match the first 4 chars too.
    const prefix = d.slice(0, 4);
    if (clean.includes(d) || clean.includes(prefix)) {
      return d;
    }
  }

  for (const [en, ms] of Object.entries(EN_DAY_MAP)) {
    if (clean.includes(en)) {
      return ms;
    }
  }

  return clean;
}

/** Extracts a DD-MM-YYYY or YYYY-MM-DD substring. */
export function extractDatePart(dayStr?: string): string | null {
  if (!dayStr) return null;
  const match = dayStr.match(/(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** Parses a DD-MM-YYYY display date into a local Date, or null if unrecognised. */
export function parseDisplayDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(value).trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Sorts into Monday-to-Sunday order; the backend returns days starting from the current day. */
export function sortDayLabels(days: string[]): string[] {
  const seen = new Set<string>();
  const rank = (value: string) => {
    const index = WEEKDAY_ORDER.indexOf(extractDayName(value));
    return index === -1 ? WEEKDAY_ORDER.length : index;
  };
  return days
    .filter((day) => {
      const key = extractDayName(day);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => rank(a) - rank(b));
}

/** True when both labels resolve to the same day name. */
export function isSameDay(dayA?: string, dayB?: string): boolean {
  if (!dayA || !dayB) return false;
  if (dayA.trim().toUpperCase() === dayB.trim().toUpperCase()) return true;

  const nameA = extractDayName(dayA);
  const nameB = extractDayName(dayB);
  if (nameA && nameB && nameA === nameB) return true;

  return false;
}

/** Formats a day label for UI; withDate also appends the embedded date. */
export function formatDayDisplay(
  dayStr: string | undefined,
  t?: (key: string) => string,
  options?: { short?: boolean; withDate?: boolean }
): string {
  if (!dayStr) return '';
  const clean = stripDayPrefix(dayStr);
  const dayName = extractDayName(clean);
  const datePart = extractDatePart(clean);

  let translatedDay = dayName;
  if (t && dayName) {
    const key = options?.short ? `shortDays.${dayName}` : `days.${dayName}`;
    const result = t(key);
    // i18n returns the key on miss; fall back to the raw day name.
    translatedDay = result && !result.startsWith('days.') && !result.startsWith('shortDays.') ? result : dayName;
  }

  // Wrap only a real weekday label, not a raw date echoed back.
  if (
    options?.withDate &&
    datePart &&
    translatedDay &&
    translatedDay.toUpperCase() !== datePart.toUpperCase()
  ) {
    return `${datePart} (${translatedDay})`;
  }

  if (translatedDay) {
    return translatedDay;
  }

  return clean;
}
