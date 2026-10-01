import type { Goal, GoalStatus } from '@/types/goals';
import { formatDay, formatInteger, formatVolume } from '@/utils/format';

export function goalTitle(goal: Pick<Goal, 'type' | 'exercise'>): string {
  switch (goal.type) {
    case 'EXERCISE_1RM':
      return `${goal.exercise?.name ?? 'Exercise'} · estimated 1RM`;
    case 'EXERCISE_WEIGHT':
      return `${goal.exercise?.name ?? 'Exercise'} · working weight`;
    case 'WEEKLY_WORKOUTS':
      return 'Workouts per week';
    case 'PERIOD_VOLUME':
      return 'Total volume';
  }
}

export function formatGoalValue(goal: Pick<Goal, 'unit'>, value: number): string {
  return goal.unit === 'workouts' ? formatInteger(value) : formatVolume(value);
}

export function goalTiming(goal: Goal): string {
  const { status, projectedDate, weeksMet, weeksConsidered } = goal.progress;

  if (goal.type === 'WEEKLY_WORKOUTS') {
    const history = weeksConsidered ? `${weeksMet ?? 0} of the last ${weeksConsidered} weeks met.` : 'First week.';
    return `This week · ${history}`;
  }
  if (status === 'ACHIEVED') {
    return goal.achievedAt ? `Reached on ${formatDay(goal.achievedAt)}.` : 'Reached.';
  }
  const deadline = goal.deadline ? ` Deadline ${formatDay(goal.deadline)}.` : '';
  if (status === 'NOT_ENOUGH_DATA') {
    return `Needs a few more sessions to project.${deadline}`;
  }
  if (projectedDate) {
    return `Expected around ${formatDay(projectedDate)}.${deadline}`;
  }
  return `The current trend does not reach it.${deadline}`;
}

const STATUS_RANK: Readonly<Record<GoalStatus, number>> = {
  OFF_TRACK: 0,
  ON_TRACK: 1,
  NOT_ENOUGH_DATA: 2,
  ACHIEVED: 3,
};

export function sortGoals(goals: readonly Goal[]): Goal[] {
  return [...goals].sort(
    (a, b) => STATUS_RANK[a.progress.status] - STATUS_RANK[b.progress.status] || b.progress.percent - a.progress.percent,
  );
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
