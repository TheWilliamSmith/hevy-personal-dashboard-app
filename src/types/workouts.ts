/**
 * Mirrors the API's workouts DTOs (api/src/workouts/dto/*).
 *
 * Every Decimal column is already converted to a JSON number by the API's
 * serialization mapper, rounded to one decimal for volumes — so these are
 * numbers here, not strings.
 */

export type SetType = 'NORMAL' | 'WARMUP' | 'FAILURE' | 'DROP';

export interface ExerciseSet {
  /** Zero-based index inside its exercise. The API sends no set id. */
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  volumeKg: number | null;
}

/** The API's own pick: highest-volume working set, warm-ups excluded. */
export interface BestSet {
  weightKg: number | null;
  reps: number | null;
  volumeKg: number;
}

export interface WorkoutExerciseDetail {
  id: string;
  name: string;
  /** Zero-based order of appearance in the workout. */
  order: number;
  supersetId: number | null;
  notes: string | null;
  setCount: number;
  volumeKg: number;
  bestSet: BestSet | null;
  sets: ExerciseSet[];
}

export interface WorkoutSummary {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  /**
   * At most five names in workout order, followed by a "+n" entry when the
   * workout has more. The marker is a plain array entry, rendered as one chip.
   */
  exerciseNames: string[];
}

export interface WorkoutDetail {
  id: string;
  title: string;
  description: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  exercises: WorkoutExerciseDetail[];
}

export interface ExerciseOption {
  name: string;
  workoutCount: number;
  lastPerformedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The API's list envelope is `data`, not `items`. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Filter state as held in the route query. Dates are plain YYYY-MM-DD. */
export interface WorkoutFilters {
  search: string;
  exercise: string;
  from: string;
  to: string;
}
