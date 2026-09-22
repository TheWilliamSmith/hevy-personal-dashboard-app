/**
 * Mirrors api/src/exercises/dto/* — verified field-for-field against the
 * running API. The three unions match the Prisma enums the DTOs re-export.
 */

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

export type Equipment =
  | 'BARBELL'
  | 'DUMBBELL'
  | 'MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'ASSISTED'
  | 'OTHER';

export type ExerciseKind = 'STRENGTH' | 'CARDIO' | 'BODYWEIGHT_HOLD';

export type ExerciseTrend = 'up' | 'down' | 'flat' | 'insufficient_data';

export type ExerciseSortBy = 'name' | 'sessions' | 'volume' | 'lastPerformed';

/* ---------------------------------------------------------------- catalogue */

export interface ExerciseCard {
  id: string;
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  kind: ExerciseKind;
  isCustom: boolean;
  sessions: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  /** Null for CARDIO and BODYWEIGHT_HOLD. */
  maxWeightKg: number | null;
  best1RM: number | null;
  /** Null unless kind is CARDIO. */
  totalDistanceKm: number | null;
  /** Null for STRENGTH; set for CARDIO and BODYWEIGHT_HOLD. */
  totalDurationSec: number | null;
  lastPerformedAt: string | null;
  firstPerformedAt: string | null;
  /** Last 3 sessions vs the previous 3 — needs 6 sessions to be conclusive. */
  trend: ExerciseTrend;
  /** Up to 12 sessions, oldest first, same metric as `trend`. */
  sparkline: number[];
}

export interface ExerciseGroup {
  muscleGroup: MuscleGroup;
  exerciseCount: number;
  totalSets: number;
  exercises: ExerciseCard[];
}

export interface ExerciseListTotals {
  exercises: number;
  performed: number;
  neverPerformed: number;
}

export interface ExerciseCatalog {
  groups: ExerciseGroup[];
  totals: ExerciseListTotals;
}

/* ------------------------------------------------------------------ detail */

export interface ExerciseInfo {
  id: string;
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  kind: ExerciseKind;
  aliases: string[];
  isCustom: boolean;
}

export interface ExerciseSummary {
  sessions: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  avgSetsPerSession: number;
  avgRepsPerSet: number;
  avgWeightKg: number | null;
  firstPerformedAt: string | null;
  lastPerformedAt: string | null;
  daysSinceLast: number | null;
}

interface RecordBase {
  date: string;
  workoutId: string;
}

export interface WeightRecord extends RecordBase {
  weightKg: number;
  reps: number | null;
}

export interface OneRepMaxRecord extends RecordBase {
  value: number;
  weightKg: number | null;
  reps: number | null;
}

export interface VolumeRecord extends RecordBase {
  value: number;
}

export interface RepsRecord extends RecordBase {
  reps: number;
  weightKg: number | null;
}

export interface ValueRecord extends RecordBase {
  value: number;
}

export interface ExerciseRecords {
  maxWeight: WeightRecord | null;
  best1RM: OneRepMaxRecord | null;
  maxVolumeSession: VolumeRecord | null;
  maxReps: RepsRecord | null;
  longestDistanceKm: ValueRecord | null;
  longestDurationSec: ValueRecord | null;
  /** Minutes per kilometre; lower is faster. */
  bestPaceMinPerKm: ValueRecord | null;
}

export interface ProgressionPoint {
  /** ISO date, not an instant. */
  date: string;
  workoutId: string;
  maxWeightKg: number | null;
  est1RM: number | null;
  volumeKg: number | null;
  totalReps: number;
  setCount: number;
  distanceKm: number | null;
  durationSeconds: number | null;
  /** Against preceding sessions only. */
  isPR: boolean;
}

export type SetType = 'NORMAL' | 'WARMUP' | 'FAILURE' | 'DROP';

export interface HistorySet {
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  volumeKg: number | null;
  /** Null for warmups and unranked sets. */
  est1RM: number | null;
  isPR: boolean;
}

export interface HistoryBestSet {
  weightKg: number | null;
  reps: number | null;
  volumeKg: number;
}

export interface HistoryEntry {
  workoutId: string;
  workoutTitle: string;
  date: string;
  notes: string | null;
  supersetId: number | null;
  sets: HistorySet[];
  sessionVolumeKg: number;
  bestSet: HistoryBestSet | null;
}

export interface HistoryMeta {
  page: number;
  limit: number;
  /** Sessions, not sets. */
  total: number;
  totalPages: number;
}

export interface PaginatedHistory {
  data: HistoryEntry[];
  meta: HistoryMeta;
}

export interface ExerciseDetail {
  exercise: ExerciseInfo;
  summary: ExerciseSummary;
  records: ExerciseRecords;
  progression: ProgressionPoint[];
  history: PaginatedHistory;
}

/* --------------------------------------------------------------- mutations */

export interface UpdateExercisePayload {
  muscleGroup?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment?: Equipment;
  kind?: ExerciseKind;
  aliases?: string[];
}

export interface MergeExerciseResult {
  targetExerciseId: string;
  targetName: string;
  workoutExercisesRepointed: number;
  aliasesAdded: string[];
}

/** Filter state held in the route query. */
export interface ExerciseFilters {
  search: string;
  /** Multi-select client-side: the API accepts only one value. */
  muscleGroups: MuscleGroup[];
  equipment: Equipment | '';
  kind: ExerciseKind | '';
  sortBy: ExerciseSortBy;
  hideNeverPerformed: boolean;
}
