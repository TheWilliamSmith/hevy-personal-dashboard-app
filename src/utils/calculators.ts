import type { WeightUnit } from '@/types/profile';

export interface PlateSetup {
  bars: readonly number[];
  plates: readonly number[];
  increment: number;
}

export const PLATE_SETUPS: Readonly<Record<WeightUnit, PlateSetup>> = {
  kg: { bars: [20, 15, 10], plates: [25, 20, 15, 10, 5, 2.5, 1.25], increment: 2.5 },
  lb: { bars: [45, 35, 25], plates: [45, 35, 25, 10, 5, 2.5], increment: 5 },
};

export const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50] as const;

const EPSILON = 1e-9;

export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) {
    return null;
  }
  return weight * (1 + reps / 30);
}

export function repsAtPercentage(percent: number): number {
  return Math.max(1, Math.round(30 * (100 / percent - 1)));
}

export function roundToIncrement(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment;
}

export interface PercentageRow {
  percent: number;
  weight: number;
  reps: number;
}

export function percentageTable(oneRepMax: number, increment: number): PercentageRow[] {
  if (!Number.isFinite(oneRepMax) || oneRepMax <= 0) {
    return [];
  }
  return PERCENTAGES.map((percent) => ({
    percent,
    weight: roundToIncrement((oneRepMax * percent) / 100, increment),
    reps: percent === 100 ? 1 : repsAtPercentage(percent),
  }));
}

export interface PlateLoad {
  perSide: number[];
  achieved: number;
  remainder: number;
  belowBar: boolean;
}

export function platesPerSide(target: number, bar: number, available: readonly number[]): PlateLoad {
  if (!Number.isFinite(target) || target < bar) {
    return { perSide: [], achieved: bar, remainder: Math.max(0, target - bar), belowBar: target < bar };
  }
  let left = (target - bar) / 2;
  const perSide: number[] = [];
  for (const plate of [...available].sort((a, b) => b - a)) {
    while (left + EPSILON >= plate) {
      perSide.push(plate);
      left -= plate;
    }
  }
  const achieved = bar + 2 * perSide.reduce((sum, plate) => sum + plate, 0);
  return { perSide, achieved, remainder: Math.round((target - achieved) * 1000) / 1000, belowBar: false };
}
