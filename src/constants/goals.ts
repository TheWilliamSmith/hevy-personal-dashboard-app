import { t } from '@/i18n';
import type { GoalStatus, GoalType } from '@/types/goals';

export interface GoalStatusStyle {
  label: string;
  dot: string;
  text: string;
  bar: string;
}

export const GOAL_STATUS_STYLES: Readonly<Record<GoalStatus, GoalStatusStyle>> = {
  ACHIEVED: {
    get label() {
      return t('goalStatuses.ACHIEVED');
    },
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  ON_TRACK: {
    get label() {
      return t('goalStatuses.ON_TRACK');
    },
    dot: 'bg-blue-400',
    text: 'text-blue-400',
    bar: 'bg-blue-500',
  },
  OFF_TRACK: {
    get label() {
      return t('goalStatuses.OFF_TRACK');
    },
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  NOT_ENOUGH_DATA: {
    get label() {
      return t('goalStatuses.NOT_ENOUGH_DATA');
    },
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
    bar: 'bg-zinc-500',
  },
};

export interface GoalTypeOption {
  value: GoalType;
  label: string;
  shortLabel: string;
  hint: string;
}

const GOAL_TYPE_ORDER: readonly GoalType[] = ['EXERCISE_1RM', 'EXERCISE_WEIGHT', 'WEEKLY_WORKOUTS', 'PERIOD_VOLUME'];

export const GOAL_TYPES: readonly GoalTypeOption[] = GOAL_TYPE_ORDER.map((value) => ({
  value,
  get label() {
    return t(`goalTypes.${value}`);
  },
  get shortLabel() {
    return t(`goalTypesShort.${value}`);
  },
  get hint() {
    return t(`goalTypeHints.${value}`);
  },
}));

export function isExerciseGoal(type: GoalType): boolean {
  return type === 'EXERCISE_1RM' || type === 'EXERCISE_WEIGHT';
}
