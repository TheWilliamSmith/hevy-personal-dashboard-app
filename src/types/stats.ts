export type Granularity = 'day' | 'week' | 'month';

export type TimeseriesMetric = 'volume' | 'sets' | 'reps' | 'duration' | 'workouts';

export type DistributionDimension = 'weekday' | 'hourOfDay' | 'setType' | 'repRange';

export interface StatsRange {
  from?: string;
  to?: string;
}

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

export interface TimeseriesPoint {
  bucket: string;
  value: number;
  workoutCount: number;
}

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

export interface ProgressionPoint {
  date: string;
  value: number;
  workoutId: string;
  weightKg: number | null;
  reps: number | null;
}

export interface DistributionBucket {
  key: string;
  workouts: number;
  sets: number;
  volumeKg: number;
  percentage: number;
}

export interface CalendarDay {
  date: string;
  workouts: number;
  volumeKg: number;
  durationSec: number;
}

export type HeatmapMetric = 'sets' | 'volume' | 'reps';

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

export type MuscleGroupValues = Record<MuscleGroup, number>;

export interface MuscleHeatmap {
  metric: HeatmapMetric;
  from: string;
  to: string;
  values: MuscleGroupValues;
  max: number;
  topMuscle: MuscleGroup | null;
  leastTrained: MuscleGroup[];
  weeklyAverage: MuscleGroupValues;
  previous: MuscleGroupValues;
}
