export type GoalType = 'EXERCISE_1RM' | 'EXERCISE_WEIGHT' | 'WEEKLY_WORKOUTS' | 'PERIOD_VOLUME';

export type GoalStatus = 'ACHIEVED' | 'ON_TRACK' | 'OFF_TRACK' | 'NOT_ENOUGH_DATA';

export interface GoalExercise {
  id: string;
  name: string;
  slug: string;
}

export interface GoalProgress {
  current: number;
  percent: number;
  status: GoalStatus;
  projectedDate: string | null;
  weeksMet?: number;
  weeksConsidered?: number;
}

export interface Goal {
  id: string;
  type: GoalType;
  target: number;
  unit: 'kg' | 'workouts';
  exercise: GoalExercise | null;
  startsAt: string;
  deadline: string | null;
  achievedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  progress: GoalProgress;
}

export interface GoalInput {
  type: GoalType;
  exerciseId?: string;
  target: number;
  deadline?: string;
  startsAt?: string;
}

export interface GoalChanges {
  target?: number;
  deadline?: string | null;
  archived?: boolean;
}
