/**
 * Mirrors api/src/stats/dto/*.
 *
 * Shape notes that drive the UI:
 *   - every list endpoint returns a BARE array, not a { data, meta } envelope;
 *   - timeseries, progression and distribution each return ONE metric or
 *     dimension per request, selected by a query param — switching them is a
 *     refetch, not a client-side recompute;
 *   - `previous` on the overview carries only four metrics, so reps and total
 *     duration have no comparison to show.
 */

export type Granularity = 'day' | 'week' | 'month';

/** Values accepted by /stats/timeseries?metric= */
export type TimeseriesMetric = 'volume' | 'sets' | 'reps' | 'duration' | 'workouts';

/** Values accepted by /stats/exercises/:name/progression?metric= */
export type ProgressionMetric = 'maxWeight' | 'est1RM' | 'volume' | 'totalReps';

export type ExerciseSortBy = 'volume' | 'sets' | 'sessions';

export type DistributionDimension = 'weekday' | 'hourOfDay' | 'setType' | 'repRange';

/** Shared window. Omitting both bounds means all time. */
export interface StatsRange {
  from?: string;
  to?: string;
}

/* ------------------------------------------------------------------ overview */

/** Only these four metrics exist for the preceding window. */
export interface PreviousPeriod {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalSets: number;
  avgDurationSec: number;
}

export interface Overview {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  totalDurationSec: number;
  avgDurationSec: number;
  avgVolumePerWorkout: number;
  avgSetsPerWorkout: number;
  firstWorkoutAt: string | null;
  lastWorkoutAt: string | null;
  distinctExercises: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  workoutsPerWeekAvg: number;
  previous: PreviousPeriod;
}

/* ---------------------------------------------------------------- timeseries */

export interface TimeseriesPoint {
  /** Bucket start as an ISO date, e.g. "2026-09-07". */
  bucket: string;
  /** The requested metric only. */
  value: number;
  workoutCount: number;
}

/* ----------------------------------------------------------------- exercises */

export interface ExerciseStats {
  name: string;
  sessions: number;
  sets: number;
  reps: number;
  totalVolumeKg: number;
  maxWeightKg: number | null;
  best1RM: number | null;
  lastPerformedAt: string;
  firstPerformedAt: string;
}

/* --------------------------------------------------------------- progression */

export interface ProgressionPoint {
  /** Session date, ISO date. */
  date: string;
  /** The requested metric only. */
  value: number;
  workoutId: string;
  weightKg: number | null;
  reps: number | null;
}

/* ------------------------------------------------------------------- records */

export interface RecordEntry {
  value: number;
  date: string;
  workoutId: string;
}

export interface WeightRecord extends RecordEntry {
  reps: number | null;
}

export interface OneRepMaxRecord extends RecordEntry {
  weightKg: number | null;
  reps: number | null;
}

export interface ExerciseRecords {
  exercise: string;
  maxWeightKg: WeightRecord | null;
  best1RM: OneRepMaxRecord | null;
  maxVolumeSession: RecordEntry | null;
}

/* -------------------------------------------------------------- distribution */

export interface DistributionBucket {
  /** Label for the requested dimension, e.g. "Monday" or "1-5". */
  key: string;
  workouts: number;
  sets: number;
  volumeKg: number;
  /** Share of the dimension total, 0-100, one decimal. */
  percentage: number;
}

/* ------------------------------------------------------------------ calendar */

export interface CalendarDay {
  /** YYYY-MM-DD. Days without activity are omitted entirely. */
  date: string;
  workouts: number;
  volumeKg: number;
  durationSec: number;
}

/* ------------------------------------------------------- muscle heat map */

/**
 * Mirrors MuscleHeatmapDto in api/src/stats/dto/stats-response.dto.ts,
 * verified field-for-field against the running API.
 */
export type HeatmapMetric = 'sets' | 'volume' | 'reps';

/** Mirrors the Prisma MuscleGroup enum, as BodyHeatmap expects it. */
export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'TRAPS'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'FOREARMS'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'ADDUCTORS'
  | 'CALVES'
  | 'ABS'
  | 'CARDIO'
  | 'FULL_BODY';

/** Every MuscleGroup key is always present; 0 means untrained, never absent. */
export type MuscleGroupValues = Record<MuscleGroup, number>;

export interface MuscleHeatmap {
  metric: HeatmapMetric;
  /** The resolved window, echoed back. */
  from: string;
  to: string;
  values: MuscleGroupValues;
  max: number;
  topMuscle: MuscleGroup | null;
  /** Lowest 3 by value, excluding groups never trained in the window. */
  leastTrained: MuscleGroup[];
  /** `values` divided by the number of ISO weeks in range. */
  weeklyAverage: MuscleGroupValues;
  /** Same shape as `values`, for the preceding window of equal length. */
  previous: MuscleGroupValues;
}
