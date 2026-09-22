import type { Equipment, ExerciseKind, MuscleGroup } from '@/types/exercises';

/**
 * Anatomical order, top-down then front-to-back. The API returns groups
 * alphabetically, so the list view sorts with this — it is the single source of
 * truth for order, labels and colour.
 */
export const MUSCLE_ORDER: readonly MuscleGroup[] = [
  'CHEST',
  'BACK',
  'TRAPS',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'ADDUCTORS',
  'CALVES',
  'ABS',
  'CARDIO',
  'FULL_BODY',
];

export const MUSCLE_LABELS: Readonly<Record<MuscleGroup, string>> = {
  CHEST: 'Chest',
  BACK: 'Back',
  TRAPS: 'Traps',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  ADDUCTORS: 'Adductors',
  CALVES: 'Calves',
  ABS: 'Abs',
  CARDIO: 'Cardio',
  FULL_BODY: 'Full body',
};

/**
 * One hue per muscle group, usable by chips today and by charts later.
 * `text`/`bg`/`ring` are Tailwind classes; `hex` is for canvas-rendered charts,
 * which cannot read a class.
 */
export interface MuscleStyle {
  hex: string;
  chip: string;
}

export const MUSCLE_STYLES: Readonly<Record<MuscleGroup, MuscleStyle>> = {
  CHEST: { hex: '#4f46e5', chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  BACK: { hex: '#0ea5e9', chip: 'bg-sky-50 text-sky-700 ring-sky-200' },
  TRAPS: { hex: '#0891b2', chip: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  SHOULDERS: { hex: '#14b8a6', chip: 'bg-teal-50 text-teal-700 ring-teal-200' },
  BICEPS: { hex: '#16a34a', chip: 'bg-green-50 text-green-700 ring-green-200' },
  TRICEPS: { hex: '#65a30d', chip: 'bg-lime-50 text-lime-700 ring-lime-200' },
  FOREARMS: { hex: '#ca8a04', chip: 'bg-yellow-50 text-yellow-800 ring-yellow-200' },
  QUADS: { hex: '#f59e0b', chip: 'bg-amber-50 text-amber-800 ring-amber-200' },
  HAMSTRINGS: { hex: '#ea580c', chip: 'bg-orange-50 text-orange-700 ring-orange-200' },
  GLUTES: { hex: '#e11d48', chip: 'bg-rose-50 text-rose-700 ring-rose-200' },
  ADDUCTORS: { hex: '#db2777', chip: 'bg-pink-50 text-pink-700 ring-pink-200' },
  CALVES: { hex: '#9333ea', chip: 'bg-purple-50 text-purple-700 ring-purple-200' },
  ABS: { hex: '#7c3aed', chip: 'bg-violet-50 text-violet-700 ring-violet-200' },
  CARDIO: { hex: '#ec4899', chip: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
  FULL_BODY: { hex: '#64748b', chip: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export const EQUIPMENT_ORDER: readonly Equipment[] = [
  'BARBELL',
  'DUMBBELL',
  'MACHINE',
  'CABLE',
  'BODYWEIGHT',
  'ASSISTED',
  'OTHER',
];

export const EQUIPMENT_LABELS: Readonly<Record<Equipment, string>> = {
  BARBELL: 'Barbell',
  DUMBBELL: 'Dumbbell',
  MACHINE: 'Machine',
  CABLE: 'Cable',
  BODYWEIGHT: 'Bodyweight',
  ASSISTED: 'Assisted',
  OTHER: 'Other',
};

export const KIND_ORDER: readonly ExerciseKind[] = ['STRENGTH', 'CARDIO', 'BODYWEIGHT_HOLD'];

export const KIND_LABELS: Readonly<Record<ExerciseKind, string>> = {
  STRENGTH: 'Strength',
  CARDIO: 'Cardio',
  BODYWEIGHT_HOLD: 'Hold',
};

/** Sorts any muscle group by the anatomical order; unknown values go last. */
export function muscleRank(group: MuscleGroup): number {
  const index = MUSCLE_ORDER.indexOf(group);
  return index === -1 ? MUSCLE_ORDER.length : index;
}
