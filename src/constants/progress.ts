import type { MetricUsed, ProgressParams, ProgressStatus } from '@/types/progress';

/**
 * The single source of truth for how a status looks and reads on this page.
 * The strip, the pills and the sparklines all read from here, so a status
 * never changes colour between two places.
 */
export interface StatusStyle {
  label: string;
  /** Canvas/SVG colour, for the sparkline stroke. */
  hex: string;
  /** Pill. */
  pill: string;
  /** Strip counter, idle and selected. */
  strip: string;
  stripActive: string;
  /** Empty-list copy when this status is the active filter. */
  empty: string;
}

/** Same order as STATUS_SORT_RANK in the API: most urgent first. */
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
    hex: '#dc2626',
    pill: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    strip: 'border-red-200 text-red-700 hover:bg-red-50',
    stripActive: 'border-red-600 bg-red-600 text-white',
    empty: 'Nothing regressing — good.',
  },
  PLATEAU: {
    label: 'Plateau',
    hex: '#d97706',
    pill: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    strip: 'border-amber-200 text-amber-800 hover:bg-amber-50',
    stripActive: 'border-amber-500 bg-amber-500 text-white',
    empty: 'No plateaus in this window.',
  },
  STALE: {
    label: 'Stale',
    hex: '#475569',
    pill: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
    strip: 'border-slate-300 text-slate-700 hover:bg-slate-100',
    stripActive: 'border-slate-600 bg-slate-600 text-white',
    empty: 'Nothing stale — everything is still in rotation.',
  },
  PROGRESSING: {
    label: 'Progressing',
    hex: '#16a34a',
    pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    strip: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    stripActive: 'border-emerald-600 bg-emerald-600 text-white',
    empty: 'Nothing is climbing past the threshold yet.',
  },
  // Deliberately not a problem colour, and never "no progress": the API
  // simply has fewer than 4 sessions to judge from.
  NOT_ENOUGH_DATA: {
    label: 'Needs more sessions',
    hex: '#cbd5e1',
    // A real dashed border: a ring cannot be dashed, and the dash is what
    // separates "not judged yet" from the four statuses that are judgements.
    pill: 'border border-dashed border-slate-300 bg-white text-slate-500',
    strip: 'border-dashed border-slate-300 text-slate-500 hover:bg-slate-50',
    stripActive: 'border-dashed border-slate-400 bg-slate-100 text-slate-700',
    empty: 'Every exercise has enough sessions to assess.',
  },
};

/** Statuses that describe a problem. NOT_ENOUGH_DATA is intentionally absent. */
export const ATTENTION_STATUSES: readonly ProgressStatus[] = ['REGRESSING', 'PLATEAU', 'STALE'];

export const PROGRESS_DEFAULTS: Readonly<Omit<ProgressParams, 'muscleGroup'>> = {
  window: '12w',
  sessions: 6,
  staleWeeks: 4,
  threshold: 0.5,
};

export const WINDOWS: ReadonlyArray<{ value: ProgressParams['window']; label: string }> = [
  { value: '8w', label: '8 weeks' },
  { value: '12w', label: '12 weeks' },
  { value: '26w', label: '26 weeks' },
  { value: '52w', label: '52 weeks' },
];

/** Bounds the API validates; the controls never offer anything outside them. */
export const SESSIONS_RANGE = { min: 4, max: 10 } as const;
export const STALE_RANGE = { min: 2, max: 8 } as const;
export const THRESHOLD_RANGE = { min: 0.1, max: 3, step: 0.1 } as const;

/** Muted weekly volume below which a stall is more likely programming than a plateau. */
export const LOW_WEEKLY_SETS = 2;

export const METRIC_LABELS: Readonly<Record<MetricUsed, string>> = {
  est1RM: 'est. 1RM',
  totalReps: 'total reps',
  distancePerMinute: 'distance per minute',
  longestHoldSeconds: 'longest hold',
};
