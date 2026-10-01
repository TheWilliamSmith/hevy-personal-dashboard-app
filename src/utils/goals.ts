import { t } from '@/i18n';
import type { Goal, GoalStatus } from '@/types/goals';
import { formatDay, formatInteger, formatVolume } from '@/utils/format';

export function goalTitle(goal: Pick<Goal, 'type' | 'exercise'>): string {
  switch (goal.type) {
    case 'EXERCISE_1RM':
      return t('goalText.oneRepMax', { exercise: goal.exercise?.name ?? t('goalText.exercise') });
    case 'EXERCISE_WEIGHT':
      return t('goalText.workingWeight', { exercise: goal.exercise?.name ?? t('goalText.exercise') });
    case 'WEEKLY_WORKOUTS':
      return t('goalText.weeklyWorkouts');
    case 'PERIOD_VOLUME':
      return t('goalText.totalVolume');
  }
}

export function formatGoalValue(goal: Pick<Goal, 'unit'>, value: number): string {
  return goal.unit === 'workouts' ? formatInteger(value) : formatVolume(value);
}

export function goalTiming(goal: Goal): string {
  const { status, projectedDate, weeksMet, weeksConsidered } = goal.progress;

  if (goal.type === 'WEEKLY_WORKOUTS') {
    const history = weeksConsidered
      ? t('goalText.weeksMet', { met: weeksMet ?? 0, count: weeksConsidered })
      : t('goalText.firstWeek');
    return t('goalText.thisWeek', { history });
  }
  if (status === 'ACHIEVED') {
    return goal.achievedAt ? t('goalText.reachedOn', { date: formatDay(goal.achievedAt) }) : t('goalText.reached');
  }
  const deadline = goal.deadline ? t('goalText.deadline', { date: formatDay(goal.deadline) }) : '';
  if (status === 'NOT_ENOUGH_DATA') {
    return t('goalText.needsSessions', { deadline });
  }
  if (projectedDate) {
    return t('goalText.expected', { date: formatDay(projectedDate), deadline });
  }
  return t('goalText.notReaching', { deadline });
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
