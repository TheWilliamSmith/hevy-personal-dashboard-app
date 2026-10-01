import { describe, expect, it } from 'vitest';

import type { WorkoutExerciseDetail, WorkoutSummary } from '@/types/workouts';
import { matchExercises, normalizeName, suggestReference } from '@/utils/workout-compare';

let nextId = 0;

function exercise(name: string, order: number): WorkoutExerciseDetail {
  nextId += 1;
  return { id: `e${nextId}`, name, order, supersetId: null, notes: null, setCount: 3, volumeKg: 1000, bestSet: null, sets: [] };
}

function summary(id: string, title: string, startedAt: string): WorkoutSummary {
  return {
    id,
    title,
    startedAt,
    endedAt: startedAt,
    durationSec: 3600,
    exerciseCount: 3,
    setCount: 9,
    totalVolumeKg: 3000,
    exerciseNames: [],
  };
}

describe('normalizeName', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeName('  Développé   Couché ')).toBe('developpe couche');
    expect(normalizeName('Bench Press (Barbell)')).toBe(normalizeName('bench press (barbell)'));
  });
});

describe('matchExercises', () => {
  it('pairs the exercises both workouts share, in the current workout order', () => {
    const current = [exercise('Squat (Barbell)', 1), exercise('Bench Press (Barbell)', 0)];
    const reference = [exercise('bench press (barbell)', 0), exercise('Squat (Barbell)', 1)];

    const { pairs, onlyCurrent, onlyReference } = matchExercises(current, reference);

    expect(pairs.map((pair) => [pair.current.id, pair.reference.id])).toEqual([
      [current[1]?.id, reference[0]?.id],
      [current[0]?.id, reference[1]?.id],
    ]);
    expect(onlyCurrent).toEqual([]);
    expect(onlyReference).toEqual([]);
  });

  it('lists the exercises found on one side only', () => {
    const current = [exercise('Squat (Barbell)', 0), exercise('Leg Press', 1)];
    const reference = [exercise('Squat (Barbell)', 0), exercise('Lunge', 1), exercise('Calf Raise', 2)];

    const { pairs, onlyCurrent, onlyReference } = matchExercises(current, reference);

    expect(pairs.map((pair) => pair.name)).toEqual(['Squat (Barbell)']);
    expect(onlyCurrent.map((item) => item.name)).toEqual(['Leg Press']);
    expect(onlyReference.map((item) => item.name)).toEqual(['Lunge', 'Calf Raise']);
  });

  it('pairs an exercise done twice by occurrence, and keeps the extra one apart', () => {
    const current = [exercise('Pull Up', 0), exercise('Row', 1), exercise('Pull Up', 2)];
    const reference = [exercise('Pull Up', 0)];

    const { pairs, onlyCurrent, onlyReference } = matchExercises(current, reference);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.current.id).toBe(current[0]?.id);
    expect(onlyCurrent.map((item) => item.id)).toEqual([current[1]?.id, current[2]?.id]);
    expect(onlyReference).toEqual([]);
  });

  it('gives every pair a distinct key', () => {
    const current = [exercise('Pull Up', 0), exercise('Pull Up', 1)];
    const reference = [exercise('Pull Up', 0), exercise('Pull Up', 1)];

    const keys = matchExercises(current, reference).pairs.map((pair) => pair.key);

    expect(new Set(keys).size).toBe(2);
  });

  it('handles empty workouts', () => {
    expect(matchExercises([], [])).toEqual({ pairs: [], onlyCurrent: [], onlyReference: [] });
  });
});

describe('suggestReference', () => {
  const workout = { id: 'w3', title: 'Push Day', startedAt: '2026-09-20T10:00:00.000Z' };

  it('picks the latest earlier workout with the same title', () => {
    const candidates = [
      summary('w4', 'Push Day', '2026-09-27T10:00:00.000Z'),
      summary('w3', 'Push Day', '2026-09-20T10:00:00.000Z'),
      summary('w2', 'push day', '2026-09-13T10:00:00.000Z'),
      summary('w1', 'Push Day', '2026-09-06T10:00:00.000Z'),
      summary('x', 'Pull Day', '2026-09-18T10:00:00.000Z'),
    ];

    expect(suggestReference(workout, candidates)?.id).toBe('w2');
  });

  it('suggests nothing when no earlier workout has the same title', () => {
    const candidates = [summary('x', 'Pull Day', '2026-09-18T10:00:00.000Z'), summary('w4', 'Push Day', '2026-09-27T10:00:00.000Z')];

    expect(suggestReference(workout, candidates)).toBeNull();
  });
});
