import { t, translated } from '@/i18n';
import type { MetricUsed, ProgressParams, ProgressStatus } from '@/types/progress';

export interface StatusStyle {
  label: string;
  color: string;
  dot: string;
  text: string;
  empty: string;
}

export const STATUS_ORDER: readonly ProgressStatus[] = [
  'REGRESSING',
  'PLATEAU',
  'STALE',
  'PROGRESSING',
  'NOT_ENOUGH_DATA',
];

export const STATUS_STYLES: Readonly<Record<ProgressStatus, StatusStyle>> = {
  REGRESSING: {
    get label() {
      return t('statuses.REGRESSING');
    },
    color: 'var(--color-red-400)',
    dot: 'bg-red-400',
    text: 'text-red-400',
    get empty() {
      return t('statusEmpty.REGRESSING');
    },
  },
  PLATEAU: {
    get label() {
      return t('statuses.PLATEAU');
    },
    color: 'var(--color-amber-400)',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    get empty() {
      return t('statusEmpty.PLATEAU');
    },
  },
  STALE: {
    get label() {
      return t('statuses.STALE');
    },
    color: 'var(--color-zinc-400)',
    dot: 'bg-zinc-400',
    text: 'text-zinc-400',
    get empty() {
      return t('statusEmpty.STALE');
    },
  },
  PROGRESSING: {
    get label() {
      return t('statuses.PROGRESSING');
    },
    color: 'var(--color-emerald-400)',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    get empty() {
      return t('statusEmpty.PROGRESSING');
    },
  },
  NOT_ENOUGH_DATA: {
    get label() {
      return t('statuses.NOT_ENOUGH_DATA');
    },
    color: 'var(--color-zinc-600)',
    dot: 'bg-zinc-600',
    text: 'text-zinc-500',
    get empty() {
      return t('statusEmpty.NOT_ENOUGH_DATA');
    },
  },
};

export const ATTENTION_STATUSES: readonly ProgressStatus[] = ['REGRESSING', 'PLATEAU', 'STALE'];

export const PROGRESS_DEFAULTS: Readonly<Omit<ProgressParams, 'muscleGroup'>> = {
  window: '12w',
  sessions: 6,
  staleWeeks: 4,
  threshold: 0.5,
};

export const WINDOWS: ReadonlyArray<{
  value: ProgressParams['window'];
  label: string;
  shortLabel: string;
}> = (['8w', '12w', '26w', '52w'] as const).map((value) => ({
  value,
  get label() {
    return t(`windows.${value}`);
  },
  get shortLabel() {
    return t(`windows.short${value}`);
  },
}));

export const SESSIONS_RANGE = { min: 4, max: 10 } as const;
export const STALE_RANGE = { min: 2, max: 8 } as const;
export const THRESHOLD_RANGE = { min: 0.1, max: 3, step: 0.1 } as const;

export const LOW_WEEKLY_SETS = 2;

export const METRIC_LABELS: Readonly<Record<MetricUsed, string>> = translated(
  ['est1RM', 'totalReps', 'distancePerMinute', 'longestHoldSeconds'],
  (key) => `metricsUsed.${key}`,
);
