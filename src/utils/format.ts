/** Display helpers. Every one of them renders a missing value as an em dash. */

export const EMPTY = '—';

/**
 * Rendered in UTC on purpose. The API maps Hevy's offset-less wall-clock
 * strings straight onto UTC components (see the API's french-date.ts), so
 * "15:03" in the export is stored as 15:03Z. Formatting in the viewer's local
 * zone would shift every workout by their offset.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

/** "jeu. 10 sept. 2026, 15:03" — fr-FR, regardless of the browser locale. */
export function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY;
  }

  // Intl uses a narrow no-break space before the time; normalise to a plain one.
  return DATE_FORMATTER.format(date).replace(/ /g, ' ');
}

/** 3720 -> "1h02", 600 -> "10 min", 45 -> "45 s". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return EMPTY;
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  }

  return minutes > 0 ? `${minutes} min` : `${total} s`;
}

/** Volumes arrive rounded to one decimal from the API; keep that decimal. */
const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/**
 * 12500 -> "12 500 kg". Accepts the strings the API sends for Decimal columns.
 * The separator is a plain space, not the narrow no-break space Intl emits.
 */
export function formatVolume(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  return `${NUMBER_FORMATTER.format(amount).replace(/ | /g, ' ')} kg`;
}

/** 60 -> "60", 62.5 -> "62,5". Also accepts the strings older callers pass. */
export function formatWeight(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  return amount.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
}

export function formatNumber(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  return amount === null ? EMPTY : amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

/** Null, empty and unparseable all collapse to null so callers render EMPTY. */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

const INTEGER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** 12500 -> "12 500". Plain spaces, like formatVolume. */
export function formatInteger(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  return INTEGER_FORMATTER.format(amount).replace(/\u202f|\u00a0/g, ' ');
}

/** Signed percentage change, null when the baseline is 0 or missing. */
export function percentChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  const now = toNumber(current);
  const before = toNumber(previous);

  if (now === null || before === null || before === 0) {
    return null;
  }

  return ((now - before) / Math.abs(before)) * 100;
}

/** 12.3 -> "+12,3 %", -4 -> "-4 %". */
export function formatPercent(value: number | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  const rendered = Math.abs(amount).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  return `${amount >= 0 ? '+' : '-'}${rendered} %`;
}

/** YYYY-MM-DD, the calendar heatmap's key format. */
export function formatDayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/** Short bucket label for time axes: "10 sept." for a day, "sept. 2026" monthly. */
export function formatBucket(value: string, granularity: 'day' | 'week' | 'month'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY;
  }

  const options: Intl.DateTimeFormatOptions =
    granularity === 'month'
      ? { month: 'short', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'short', timeZone: 'UTC' };

  return new Intl.DateTimeFormat('fr-FR', options).format(date).replace(/\u202f/g, ' ');
}
