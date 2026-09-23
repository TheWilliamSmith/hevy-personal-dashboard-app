/**
 * Mirrors api/src/progress/dto/* and the enums in progress-math.ts, verified
 * field-for-field against the running API.
 */
import type { Equipment, ExerciseKind, MuscleGroup } from './exercises';

/** Mirrors ProgressStatus. */
export type ProgressStatus =
  | 'REGRESSING'
  | 'PLATEAU'
  | 'STALE'
  | 'PROGRESSING'
  | 'NOT_ENOUGH_DATA';

/** Mirrors MetricUsed: the yardstick depends on the exercise kind. */
export type MetricUsed = 'est1RM' | 'totalReps' | 'distancePerMinute' | 'longestHoldSeconds';

/** Sent as "Nw"; the API accepts 4w-104w, the UI offers these four. */
export type ProgressWindow = '8w' | '12w' | '26w' | '52w';

/**
 * Query sent to GET /progress/alerts. Note `threshold`, not
 * `progressThreshold`: the API forbids unknown parameters, so the name must
 * match exactly or every request is a 400.
 */
export interface ProgressParams {
  window: ProgressWindow;
  /** API bounds 3-20; the UI offers 4-10. */
  sessions: number;
  /** API bounds 1-52; the UI offers 2-8. */
  staleWeeks: number;
  /** %/week, API bounds 0-5. */
  threshold: number;
  muscleGroup: MuscleGroup | null;
}

/** ProgressParamsDto: what the server actually applied. */
export interface AppliedProgressParams {
  windowWeeks: number;
  sessions: number;
  staleWeeks: number;
  threshold: number;
}

export type StatusCounts = Record<ProgressStatus, number>;

export interface ProgressValueRef {
  value: number;
  /** ISO instant. */
  date: string;
  workoutId: string;
}

/**
 * One point of the analysed series. There is no workout id or set count on
 * it, so the session table can show value and PR only.
 */
export interface ProgressSessionPoint {
  /** ISO date, e.g. "2026-09-10". */
  date: string;
  value: number;
  /** Against the exercise's full history, not just this window. */
  isPR: boolean;
}

export interface ProgressItem {
  exerciseId: string;
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  kind: ExerciseKind;
  status: ProgressStatus;
  metricUsed: MetricUsed;
  /** Null under NOT_ENOUGH_DATA: no regression was run. */
  slopePctPerWeek: number | null;
  /** Sessions that fed the regression (<= the `sessions` param). */
  sessionsAnalyzed: number;
  /** Most recent session ever, regardless of window. */
  current: ProgressValueRef | null;
  /** All-time best. */
  best: ProgressValueRef | null;
  weeksSincePR: number | null;
  sessionsSinceImprovement: number;
  lastPerformedAt: string;
  daysSinceLast: number;
  /** Oldest first. */
  sessions: ProgressSessionPoint[];
  avgSetsPerSession: number;
  /** Total sets in the window / windowWeeks. */
  weeklySetsAvg: number;
}

/** Muted exercises come back as this short shape, not as full items. */
export interface MutedExercise {
  exerciseId: string;
  name: string;
  slug: string;
  muteReason: string | null;
}

export interface ProgressAlertsResponse {
  params: AppliedProgressParams;
  /** Muted exercises are excluded. */
  counts: StatusCounts;
  /** Server-ranked: REGRESSING first, plateaus by weeksSincePR desc. */
  items: ProgressItem[];
  muted: MutedExercise[];
}

export interface ProgressSummary {
  counts: StatusCounts;
  /** The 3 most concerning items, in the alerts sort order. */
  topConcerns: ProgressItem[];
}

/** MuteExerciseDto. `reason` is optional, max 300 characters. */
export interface MutePayload {
  muted: boolean;
  reason?: string;
}

/** MuteResultDto. */
export interface MuteResult {
  exerciseId: string;
  muted: boolean;
  muteReason: string | null;
}
