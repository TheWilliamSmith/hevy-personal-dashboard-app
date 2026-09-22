import { describe, expect, it } from 'vitest';

import type { BestSet, ExerciseSet, SetType } from '@/types/workouts';

import { bestSetIndex } from './sets';

function set(overrides: Partial<ExerciseSet> = {}): ExerciseSet {
  return {
    setIndex: 0,
    setType: 'NORMAL' as SetType,
    weightKg: null,
    reps: null,
    distanceKm: null,
    durationSeconds: null,
    rpe: null,
    volumeKg: null,
    ...overrides,
  };
}

const best = (overrides: Partial<BestSet> = {}): BestSet => ({
  weightKg: 80,
  reps: 10,
  volumeKg: 800,
  ...overrides,
});

describe('bestSetIndex', () => {
  it('finds the row matching the API pick', () => {
    const sets = [
      set({ setIndex: 0, weightKg: 60, reps: 10, volumeKg: 600 }),
      set({ setIndex: 1, weightKg: 80, reps: 10, volumeKg: 800 }),
    ];
    expect(bestSetIndex(sets, best())).toBe(1);
  });

  it('returns null when the API reports no best set', () => {
    const sets = [set({ weightKg: 60, reps: 10, volumeKg: 600 })];
    expect(bestSetIndex(sets, null)).toBeNull();
  });

  it('keeps only the first of two identical sets', () => {
    const sets = [
      set({ setIndex: 0, weightKg: 80, reps: 10, volumeKg: 800 }),
      set({ setIndex: 1, weightKg: 80, reps: 10, volumeKg: 800 }),
    ];
    expect(bestSetIndex(sets, best())).toBe(0);
  });

  it('does not match on volume alone', () => {
    const sets = [set({ weightKg: 40, reps: 20, volumeKg: 800 })];
    expect(bestSetIndex(sets, best())).toBeNull();
  });

  it('matches a bodyweight best set with a null weight', () => {
    const sets = [set({ weightKg: null, reps: 12, volumeKg: 0 })];
    expect(bestSetIndex(sets, best({ weightKg: null, reps: 12, volumeKg: 0 }))).toBe(0);
  });

  it('returns null for an empty exercise', () => {
    expect(bestSetIndex([], best())).toBeNull();
  });
});
