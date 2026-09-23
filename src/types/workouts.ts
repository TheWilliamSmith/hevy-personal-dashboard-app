export type SetType = 'NORMAL' | 'WARMUP' | 'FAILURE' | 'DROP';

export interface ExerciseSet {
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  volumeKg: number | null;
}

export interface BestSet {
  weightKg: number | null;
  reps: number | null;
  volumeKg: number;
}

export interface WorkoutExerciseDetail {
  id: string;
  name: string;
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

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface WorkoutFilters {
  search: string;
  exercise: string;
  from: string;
  to: string;
}
