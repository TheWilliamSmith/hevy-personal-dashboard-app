import { describe, expect, it } from 'vitest';

import { isExerciseGoal } from '@/constants/goals';
import type { Goal } from '@/types/goals';
import { formatGoalValue, goalTiming, goalTitle, sortGoals } from '@/utils/goals';

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
    expect(goalTitle(goal())).toBe('Bench Press (Barbell) · estimated 1RM');
    expect(goalTitle(goal({ type: 'EXERCISE_WEIGHT' }))).toBe('Bench Press (Barbell) · working weight');
    expect(goalTitle(goal({ type: 'WEEKLY_WORKOUTS', exercise: null }))).toBe('Workouts per week');
    expect(goalTitle(goal({ type: 'PERIOD_VOLUME', exercise: null }))).toBe('Total volume');
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
    expect(goalTiming(goal({ deadline: '2027-01-15T00:00:00.000Z' }))).toMatch(/^Expected around .+\. Deadline .+\.$/);
  });

  it('explains the other states', () => {
    expect(goalTiming(goal({ achievedAt: '2026-09-20T00:00:00.000Z' }, { status: 'ACHIEVED' }))).toMatch(/^Reached on /);
    expect(goalTiming(goal({}, { status: 'NOT_ENOUGH_DATA', projectedDate: null }))).toBe(
      'Needs a few more sessions to project.',
    );
    expect(goalTiming(goal({}, { status: 'OFF_TRACK', projectedDate: null }))).toBe(
      'The current trend does not reach it.',
    );
  });

  it('summarises past weeks for a weekly goal', () => {
    const weekly = goal({ type: 'WEEKLY_WORKOUTS', unit: 'workouts' }, { weeksMet: 3, weeksConsidered: 4 });
    expect(goalTiming(weekly)).toBe('This week · 3 of the last 4 weeks met.');
    expect(goalTiming(goal({ type: 'WEEKLY_WORKOUTS' }, { weeksConsidered: 0 }))).toBe('This week · First week.');
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
