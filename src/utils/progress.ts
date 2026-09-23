import type { MetricUsed, ProgressItem } from '@/types/progress';

import { EMPTY, formatWeight, toNumber } from './format';

export function formatMetricValue(metric: MetricUsed, value: number | null | undefined): string {
  const amount = toNumber(value);
  if (amount === null) {
    return EMPTY;
  }

  switch (metric) {
    case 'est1RM':
      return `${formatWeight(amount)} kg`;
    case 'totalReps':
      return `${Math.round(amount)} reps`;
    case 'distancePerMinute':
      return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} km/min`;
    case 'longestHoldSeconds':
      return formatHold(amount);
  }
}

export function formatSlope(slope: number | null | undefined): string {
  const amount = toNumber(slope);
  if (amount === null) {
    return EMPTY;
  }
  const rendered = Math.abs(amount).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  return `${amount >= 0 ? '+' : '-'}${rendered} %/week`;
}

export function formatGapToBest(gap: number | null | undefined): string {
  const amount = toNumber(gap);
  if (amount === null) {
    return EMPTY;
  }
  const rounded = Math.round(amount);
  return rounded === 0 ? 'at best' : `${rounded > 0 ? '+' : '-'}${Math.abs(rounded)} % vs best`;
}

export function formatDaysAgo(days: number | null | undefined): string {
  const amount = toNumber(days);
  if (amount === null || amount < 0) {
    return EMPTY;
  }
  const whole = Math.floor(amount);
  if (whole === 0) return 'today';
  if (whole === 1) return 'yesterday';
  if (whole < 14) return `${whole} days ago`;
  return formatWeeksAgo(whole / 7);
}

export function formatWeeksAgo(weeks: number | null | undefined): string {
  const amount = toNumber(weeks);
  if (amount === null || amount < 0) {
    return EMPTY;
  }
  const whole = Math.floor(amount);
  if (whole === 0) return 'this week';
  return `${whole} week${whole === 1 ? '' : 's'} ago`;
}

export function formatHold(seconds: number | null | undefined): string {
  const amount = toNumber(seconds);
  if (amount === null || amount < 0) {
    return EMPTY;
  }
  const whole = Math.round(amount);
  if (whole < 60) {
    return `${whole} s`;
  }
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function gapToBestPct(item: Pick<ProgressItem, 'current' | 'best'>): number | null {
  const current = item.current?.value;
  const best = item.best?.value;
  if (current === undefined || best === undefined || best === 0) {
    return null;
  }
  return ((current - best) / best) * 100;
}
