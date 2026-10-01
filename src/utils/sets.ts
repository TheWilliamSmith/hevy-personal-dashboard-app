import { translated } from '@/i18n';
import type { BestSet, ExerciseSet, SetType } from '@/types/workouts';

export const SET_TYPE_LABELS: Readonly<Record<SetType, string>> = translated(
  ['NORMAL', 'WARMUP', 'FAILURE', 'DROP'],
  (key) => `setTypes.${key}`,
);

export const SET_TYPE_DOT_CLASSES: Readonly<Record<SetType, string>> = {
  NORMAL: 'bg-zinc-500',
  WARMUP: 'bg-amber-400',
  FAILURE: 'bg-red-400',
  DROP: 'bg-violet-400',
};

export function bestSetIndex(sets: readonly ExerciseSet[], bestSet: BestSet | null): number | null {
  if (bestSet === null) {
    return null;
  }

  const index = sets.findIndex(
    (set) =>
      set.volumeKg === bestSet.volumeKg &&
      set.weightKg === bestSet.weightKg &&
      set.reps === bestSet.reps,
  );

  return index === -1 ? null : index;
}
