export const EMPTY = '—';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY;
  }

  return DATE_FORMATTER.format(date).replace(/ /g, ' ');
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

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function formatVolume(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  return `${NUMBER_FORMATTER.format(amount).replace(/ | /g, ' ')} kg`;
}

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

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

const INTEGER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatInteger(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  return INTEGER_FORMATTER.format(amount).replace(/\u202f|\u00a0/g, ' ');
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

  const rendered = Math.abs(amount).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  return `${amount >= 0 ? '+' : '-'}${rendered} %`;
}

export function formatDayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

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

export function formatDistanceKm(value: number | string | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km`;
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

const DAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDay(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY;
  }

  return DAY_FORMATTER.format(date);
}
