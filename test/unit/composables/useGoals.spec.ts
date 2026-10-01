import { afterEach, describe, expect, it, vi } from 'vitest';

import { useGoals } from '@/composables/useGoals';
import { flushPromises, jsonResponse } from '@/test/router-harness';
import type { Goal } from '@/types/goals';

function goal(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    type: 'WEEKLY_WORKOUTS',
    target: 3,
    unit: 'workouts',
    exercise: null,
    startsAt: '2026-09-01T00:00:00.000Z',
    deadline: null,
    achievedAt: null,
    archivedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    progress: { current: 1, percent: 33.3, status: 'ON_TRACK', projectedDate: null, weeksMet: 0, weeksConsidered: 0 },
    ...overrides,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('useGoals', () => {
  it('loads the active goals, or every goal when asked', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse([goal('a')]));
    vi.stubGlobal('fetch', fetchMock);

    const goals = useGoals();
    useGoals({ includeArchived: true });
    await flushPromises();

    expect(goals.active.value.map((item) => item.id)).toEqual(['a']);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/goals');
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe('/api/goals?archived=true');
  });

  it('adds a created goal and replaces an updated one', async () => {
    const responses = [jsonResponse([goal('a')]), jsonResponse(goal('b'), 201), jsonResponse(goal('a', { target: 5 }))];
    const fetchMock = vi.fn(async () => responses.shift() ?? jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
    const goals = useGoals();
    await flushPromises();

    await goals.create({ type: 'WEEKLY_WORKOUTS', target: 4 });
    await goals.update('a', { target: 5 });

    expect(goals.goals.value.map((item) => [item.id, item.target])).toEqual([
      ['a', 5],
      ['b', 3],
    ]);
  });

  it('drops an archived goal from the active-only list and keeps it otherwise', async () => {
    const archived = goal('a', { archivedAt: '2026-10-01T10:00:00.000Z' });
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([goal('a')])));
    const activeOnly = useGoals();
    const everything = useGoals({ includeArchived: true });
    await flushPromises();

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(archived)));
    await activeOnly.update('a', { archived: true });
    await everything.update('a', { archived: true });

    expect(activeOnly.goals.value).toEqual([]);
    expect(everything.archived.value.map((item) => item.id)).toEqual(['a']);
    expect(everything.active.value).toEqual([]);
  });

  it('removes a deleted goal and reports a load error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([goal('a')])));
    const goals = useGoals();
    await flushPromises();

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ id: 'a' })));
    await goals.remove('a');
    expect(goals.goals.value).toEqual([]);

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'boom' }, 500)));
    await goals.load();
    expect(goals.error.value).toBe('The server failed to answer. Try again in a moment.');
  });
});
