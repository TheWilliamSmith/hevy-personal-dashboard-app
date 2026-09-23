import type { BestSet, ExerciseSet, SetType } from '@/types/workouts';

export const SET_TYPE_LABELS: Readonly<Record<SetType, string>> = {
  NORMAL: 'Normal',
  WARMUP: 'Warm-up',
  FAILURE: 'Failure',
  DROP: 'Drop',
};

export const SET_TYPE_CLASSES: Readonly<Record<SetType, string>> = {
  NORMAL: 'bg-slate-100 text-slate-700 ring-slate-200',
  WARMUP: 'bg-amber-100 text-amber-800 ring-amber-200',
  FAILURE: 'bg-red-100 text-red-800 ring-red-200',
  DROP: 'bg-violet-100 text-violet-800 ring-violet-200',
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
