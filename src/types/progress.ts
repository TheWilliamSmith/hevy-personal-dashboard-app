import type { Equipment, ExerciseKind, MuscleGroup } from './exercises';

export type ProgressStatus =
  | 'REGRESSING'
  | 'PLATEAU'
  | 'STALE'
  | 'PROGRESSING'
  | 'NOT_ENOUGH_DATA';

export type MetricUsed = 'est1RM' | 'totalReps' | 'distancePerMinute' | 'longestHoldSeconds';

export type ProgressWindow = '8w' | '12w' | '26w' | '52w';

export interface ProgressParams {
  window: ProgressWindow;
  sessions: number;
  staleWeeks: number;
  threshold: number;
  muscleGroup: MuscleGroup | null;
}

export interface AppliedProgressParams {
  windowWeeks: number;
  sessions: number;
  staleWeeks: number;
  threshold: number;
}

export type StatusCounts = Record<ProgressStatus, number>;

export interface ProgressValueRef {
  value: number;
  date: string;
  workoutId: string;
}

export interface ProgressSessionPoint {
  date: string;
  value: number;
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
  slopePctPerWeek: number | null;
  sessionsAnalyzed: number;
  current: ProgressValueRef | null;
  best: ProgressValueRef | null;
  weeksSincePR: number | null;
  sessionsSinceImprovement: number;
  lastPerformedAt: string;
  daysSinceLast: number;
  sessions: ProgressSessionPoint[];
  avgSetsPerSession: number;
  weeklySetsAvg: number;
}

export interface MutedExercise {
  exerciseId: string;
  name: string;
  slug: string;
  muteReason: string | null;
}

export interface ProgressAlertsResponse {
  params: AppliedProgressParams;
  counts: StatusCounts;
  items: ProgressItem[];
  muted: MutedExercise[];
}

export interface ProgressSummary {
  counts: StatusCounts;
  topConcerns: ProgressItem[];
}

export interface MutePayload {
  muted: boolean;
  reason?: string;
}

export interface MuteResult {
  exerciseId: string;
  muted: boolean;
  muteReason: string | null;
}
