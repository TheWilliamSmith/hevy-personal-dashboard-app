import type { MetricUsed, ProgressItem } from '@/types/progress';

import { EMPTY, formatWeight, toNumber } from './format';

/** A session value in the unit of the metric the API chose for this exercise. */
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
      // formatDuration rounds to minutes, which erases a 90 s plank's 30 s.
      return formatHold(amount);
  }
}

/** 1.2 -> "+1,2 %/week", -0.8 -> "-0,8 %/week". */
export function formatSlope(slope: number | null | undefined): string {
  const amount = toNumber(slope);
  if (amount === null) {
    return EMPTY;
  }
  const rendered = Math.abs(amount).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  return `${amount >= 0 ? '+' : '-'}${rendered} %/week`;
}

/** -4.2 -> "-4 % vs best"; 0 -> "at best". */
export function formatGapToBest(gap: number | null | undefined): string {
  const amount = toNumber(gap);
  if (amount === null) {
    return EMPTY;
  }
  const rounded = Math.round(amount);
  return rounded === 0 ? 'at best' : `${rounded > 0 ? '+' : '-'}${Math.abs(rounded)} % vs best`;
}

/** 0 -> "today", 1 -> "yesterday", 5 -> "5 days ago", 21 -> "3 weeks ago". */
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

/** 1 -> "1 week ago", 9 -> "9 weeks ago", 0 -> "this week". */
export function formatWeeksAgo(weeks: number | null | undefined): string {
  const amount = toNumber(weeks);
  if (amount === null || amount < 0) {
    return EMPTY;
  }
  const whole = Math.floor(amount);
  if (whole === 0) return 'this week';
  return `${whole} week${whole === 1 ? '' : 's'} ago`;
}

/** 45 -> "45 s", 90 -> "1:30", 600 -> "10:00". Seconds matter for a hold. */
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

/**
 * Current vs all-time best, in percent (0 or negative). The API sends both
 * values but not the gap; this is arithmetic for display, not a
 * classification, so it does not duplicate any server rule.
 */
export function gapToBestPct(item: Pick<ProgressItem, 'current' | 'best'>): number | null {
  const current = item.current?.value;
  const best = item.best?.value;
  if (current === undefined || best === undefined || best === 0) {
    return null;
  }
  return ((current - best) / best) * 100;
}
