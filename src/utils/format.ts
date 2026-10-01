import { intlLocale, t } from '@/i18n';

export const EMPTY = '—';

export type DateInput = string | Date | null | undefined;
export type NumericInput = number | string | null | undefined;

const formatters = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `n:${intlLocale()}:${JSON.stringify(options)}`;
  let formatter = formatters.get(key) as Intl.NumberFormat | undefined;
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale(), options);
    formatters.set(key, formatter);
  }
  return formatter;
}

export function dateFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `d:${intlLocale()}:${JSON.stringify(options)}`;
  let formatter = formatters.get(key) as Intl.DateTimeFormat | undefined;
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale(), options);
    formatters.set(key, formatter);
  }
  return formatter;
}

function tidySpaces(text: string): string {
  return text.replace(/[  ]/g, ' ');
}

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDecimal(value: number, maximumFractionDigits: number): string {
  return tidySpaces(numberFormat({ maximumFractionDigits }).format(value));
}

export function formatDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY;
  }
  return tidySpaces(
    dateFormat({
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date),
  );
}

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

export function toNumber(value: NumericInput): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function formatVolume(value: NumericInput): string {
  const amount = toNumber(value);
  return amount === null ? EMPTY : `${formatDecimal(amount, 1)} kg`;
}

export function formatWeight(value: NumericInput): string {
  const amount = toNumber(value);
  return amount === null ? EMPTY : formatDecimal(amount, 3);
}

export function formatNumber(value: NumericInput): string {
  const amount = toNumber(value);
  return amount === null ? EMPTY : formatDecimal(amount, 2);
}

export function formatInteger(value: NumericInput): string {
  const amount = toNumber(value);
  return amount === null ? EMPTY : formatDecimal(amount, 0);
}

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

export function formatPercent(value: number | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }
  return t('format.signedPercent', { sign: amount >= 0 ? '+' : '-', value: formatDecimal(Math.abs(amount), 1) });
}

export function formatDayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function formatBucket(value: string, granularity: 'day' | 'week' | 'month'): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY;
  }

  const options: Intl.DateTimeFormatOptions =
    granularity === 'month'
      ? { month: 'short', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'short', timeZone: 'UTC' };

  return tidySpaces(dateFormat(options).format(date));
}

export function formatDistanceKm(value: NumericInput): string {
  const amount = toNumber(value);
  return amount === null ? EMPTY : `${formatDecimal(amount, 2)} km`;
}

export function formatPace(minutesPerKm: number | null | undefined): string {
  const amount = toNumber(minutesPerKm);
  if (amount === null) {
    return EMPTY;
  }

  const minutes = Math.floor(amount);
  const seconds = Math.round((amount - minutes) * 60);
  const carry = seconds === 60;
  return `${minutes + (carry ? 1 : 0)}:${String(carry ? 0 : seconds).padStart(2, '0')} /km`;
}

export function formatRelativeTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY;
  }

  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) {
    return t('format.justNow');
  }

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) {
    return t('format.minutesAgo', { count: diffMin }, diffMin);
  }

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) {
    return t('format.hoursAgo', { count: diffHour }, diffHour);
  }

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) {
    return t('format.daysAgo', { count: diffDay }, diffDay);
  }

  return formatDate(date);
}

export function formatDay(value: DateInput): string {
  const date = toDate(value);
  return date
    ? tidySpaces(dateFormat({ day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date))
    : EMPTY;
}
