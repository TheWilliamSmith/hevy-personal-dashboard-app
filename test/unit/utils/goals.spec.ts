import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setLocale } from '@/i18n';
import { isExerciseGoal } from '@/constants/goals';
import type { Goal } from '@/types/goals';
import { formatGoalValue, goalTiming, goalTitle, sortGoals } from '@/utils/goals';

beforeEach(() => setLocale('fr'));
afterEach(() => setLocale('en'));

function goal(overrides: Partial<Goal> = {}, progress: Partial<Goal['progress']> = {}): Goal {
  return {
    id: 'g1',
    type: 'EXERCISE_1RM',
    target: 120,
    unit: 'kg',
    exercise: { id: 'e1', name: 'Bench Press (Barbell)', slug: 'bench-press-barbell' },
    startsAt: '2026-09-01T00:00:00.000Z',
    deadline: null,
    achievedAt: null,
    archivedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
    progress: { current: 100, percent: 83.3, status: 'ON_TRACK', projectedDate: '2026-12-01T00:00:00.000Z', ...progress },
  };
}

describe('goal labels', () => {
  it('names each goal type', () => {
    expect(goalTitle(goal())).toBe('Bench Press (Barbell) · 1RM estimé');
    expect(goalTitle(goal({ type: 'EXERCISE_WEIGHT' }))).toBe('Bench Press (Barbell) · charge de travail');
    expect(goalTitle(goal({ type: 'WEEKLY_WORKOUTS', exercise: null }))).toBe('Séances par semaine');
    expect(goalTitle(goal({ type: 'PERIOD_VOLUME', exercise: null }))).toBe('Volume total');
  });

  it('formats values in the goal unit', () => {
    expect(formatGoalValue(goal(), 107.9)).toBe('107,9 kg');
    expect(formatGoalValue(goal({ unit: 'workouts' }), 3)).toBe('3');
  });

  it('only exercise goals need an exercise', () => {
    expect(isExerciseGoal('EXERCISE_1RM')).toBe(true);
    expect(isExerciseGoal('EXERCISE_WEIGHT')).toBe(true);
    expect(isExerciseGoal('WEEKLY_WORKOUTS')).toBe(false);
    expect(isExerciseGoal('PERIOD_VOLUME')).toBe(false);
  });
});

describe('goalTiming', () => {
  it('gives the projected date and the deadline', () => {
    expect(goalTiming(goal({ deadline: '2027-01-15T00:00:00.000Z' }))).toMatch(/^Prévu vers le .+\. Échéance le .+\.$/);
  });

  it('explains the other states', () => {
    expect(goalTiming(goal({ achievedAt: '2026-09-20T00:00:00.000Z' }, { status: 'ACHIEVED' }))).toMatch(/^Atteint le /);
    expect(goalTiming(goal({}, { status: 'NOT_ENOUGH_DATA', projectedDate: null }))).toBe(
      'Encore quelques séances avant de pouvoir projeter.',
    );
    expect(goalTiming(goal({}, { status: 'OFF_TRACK', projectedDate: null }))).toBe(
      'La tendance actuelle ne l’atteint pas.',
    );
  });

  it('summarises past weeks for a weekly goal', () => {
    const weekly = goal({ type: 'WEEKLY_WORKOUTS', unit: 'workouts' }, { weeksMet: 3, weeksConsidered: 4 });
    expect(goalTiming(weekly)).toBe('Cette semaine · 3 des 4 dernières semaines réussies.');
    expect(goalTiming(goal({ type: 'WEEKLY_WORKOUTS' }, { weeksConsidered: 0 }))).toBe('Cette semaine · Première semaine.');
  });

  it('speaks English once the locale is switched', () => {
    setLocale('en');
    expect(goalTitle(goal())).toBe('Bench Press (Barbell) · estimated 1RM');
    expect(goalTiming(goal({ deadline: '2027-01-15T00:00:00.000Z' }))).toBe(
      'Expected around 1 Dec 2026. Deadline 15 Jan 2027.',
    );
  });
});

describe('sortGoals', () => {
  it('puts goals off track first, achieved last, closest first within a status', () => {
    const sorted = sortGoals([
      goal({ id: 'done' }, { status: 'ACHIEVED', percent: 100 }),
      goal({ id: 'near' }, { status: 'ON_TRACK', percent: 90 }),
      goal({ id: 'far' }, { status: 'ON_TRACK', percent: 40 }),
      goal({ id: 'late' }, { status: 'OFF_TRACK', percent: 70 }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['late', 'near', 'far', 'done']);
  });
});
