import type { GoalStatus, GoalType } from '@/types/goals';

export interface GoalStatusStyle {
  label: string;
  dot: string;
  text: string;
  bar: string;
}

export const GOAL_STATUS_STYLES: Readonly<Record<GoalStatus, GoalStatusStyle>> = {
  ACHIEVED: { label: 'Achieved', dot: 'bg-emerald-400', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  ON_TRACK: { label: 'On track', dot: 'bg-blue-400', text: 'text-blue-400', bar: 'bg-blue-500' },
  OFF_TRACK: { label: 'Off track', dot: 'bg-amber-400', text: 'text-amber-400', bar: 'bg-amber-500' },
  NOT_ENOUGH_DATA: { label: 'Needs more sessions', dot: 'bg-zinc-500', text: 'text-zinc-400', bar: 'bg-zinc-500' },
};

export interface GoalTypeOption {
  value: GoalType;
  label: string;
  shortLabel: string;
  hint: string;
}

export const GOAL_TYPES: readonly GoalTypeOption[] = [
  {
    value: 'EXERCISE_1RM',
    label: 'Estimated 1RM',
    shortLabel: '1RM',
    hint: 'Best estimated one-rep max on an exercise, from working sets.',
  },
  {
    value: 'EXERCISE_WEIGHT',
    label: 'Working weight',
    shortLabel: 'Weight',
    hint: 'Heaviest working set on an exercise, warm-ups excluded.',
  },
  {
    value: 'WEEKLY_WORKOUTS',
    label: 'Workouts per week',
    shortLabel: 'Weekly',
    hint: 'Number of workouts from Monday to Sunday.',
  },
  {
    value: 'PERIOD_VOLUME',
    label: 'Total volume',
    shortLabel: 'Volume',
    hint: 'Weight × reps added up from a start date.',
  },
];

export function isExerciseGoal(type: GoalType): boolean {
  return type === 'EXERCISE_1RM' || type === 'EXERCISE_WEIGHT';
}
