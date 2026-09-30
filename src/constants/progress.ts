import type { MetricUsed, ProgressParams, ProgressStatus } from '@/types/progress';

export interface StatusStyle {
  label: string;
  hex: string;
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
    label: 'Regressing',
    hex: '#f87171',
    dot: 'bg-red-400',
    text: 'text-red-400',
    empty: 'Nothing regressing — good.',
  },
  PLATEAU: {
    label: 'Plateau',
    hex: '#fbbf24',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    empty: 'No plateaus in this window.',
  },
  STALE: {
    label: 'Stale',
    hex: '#a1a1aa',
    dot: 'bg-zinc-400',
    text: 'text-zinc-400',
    empty: 'Nothing stale — everything is still in rotation.',
  },
  PROGRESSING: {
    label: 'Progressing',
    hex: '#34d399',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    empty: 'Nothing is climbing past the threshold yet.',
  },
  NOT_ENOUGH_DATA: {
    label: 'Needs more sessions',
    hex: '#52525b',
    dot: 'bg-zinc-600',
    text: 'text-zinc-500',
    empty: 'Every exercise has enough sessions to assess.',
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
}> = [
  { value: '8w', label: '8 weeks', shortLabel: '8W' },
  { value: '12w', label: '12 weeks', shortLabel: '12W' },
  { value: '26w', label: '26 weeks', shortLabel: '26W' },
  { value: '52w', label: '52 weeks', shortLabel: '52W' },
];

export const SESSIONS_RANGE = { min: 4, max: 10 } as const;
export const STALE_RANGE = { min: 2, max: 8 } as const;
export const THRESHOLD_RANGE = { min: 0.1, max: 3, step: 0.1 } as const;

export const LOW_WEEKLY_SETS = 2;

export const METRIC_LABELS: Readonly<Record<MetricUsed, string>> = {
  est1RM: 'est. 1RM',
  totalReps: 'total reps',
  distancePerMinute: 'distance per minute',
  longestHoldSeconds: 'longest hold',
};
