import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse, withRouter } from '@/test/router-harness';

import { hasActiveFilters, useWorkouts } from './useWorkouts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const paginated = { data: [{ id: 'w1' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } };

function stubWorkouts() {
  const fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes('/workouts/exercises')) return jsonResponse([{ name: 'Squat' }]);
    return jsonResponse(paginated);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('hasActiveFilters', () => {
  it('is false for the empty filters', () => {
    expect(hasActiveFilters({ search: '', exercise: '', from: '', to: '' })).toBe(false);
  });

  it('is true when any field is set', () => {
    expect(hasActiveFilters({ search: 'x', exercise: '', from: '', to: '' })).toBe(true);
  });
});

describe('useWorkouts', () => {
  it('loads the first page and the exercise options', async () => {
    stubWorkouts();
    const { result } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    expect(result.workouts.value).toEqual(paginated.data);
    expect(result.meta.value).toEqual(paginated.meta);
    expect(result.exercises.value).toEqual([{ name: 'Squat' }]);
    expect(result.page.value).toBe(1);
  });

  it('reads filters and page from the query', async () => {
    stubWorkouts();
    const { result } = await withRouter(
      { tab: 'workouts', search: 'push', exercise: 'Bench Press', page: '3' },
      () => useWorkouts(),
    );
    await flushPromises();

    expect(result.filters.value).toMatchObject({ search: 'push', exercise: 'Bench Press' });
    expect(result.page.value).toBe(3);
  });

  it('turns exercises fetch failures into an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/workouts/exercises')) return jsonResponse({}, 500);
        return jsonResponse(paginated);
      }),
    );
    const { result } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    expect(result.exercises.value).toEqual([]);
  });

  it('surfaces an error message when the list fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'bad request' }, 400)));
    const { result } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    expect(result.error.value).toBe('bad request');
    expect(result.workouts.value).toEqual([]);
  });

  it('debounces the search and pushes it to the query', async () => {
    vi.useFakeTimers();
    stubWorkouts();
    const { result, router } = await withRouter({}, () => useWorkouts());
    await vi.advanceTimersByTimeAsync(0);

    result.setSearch('bench');
    await vi.advanceTimersByTimeAsync(300);

    expect(router.currentRoute.value.query.search).toBe('bench');
    expect(router.currentRoute.value.query.tab).toBe('workouts');
  });

  it('pushes an exercise filter immediately', async () => {
    stubWorkouts();
    const { result, router } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    result.setExercise('Deadlift');
    await flushPromises();
    expect(router.currentRoute.value.query.exercise).toBe('Deadlift');
  });

  it('pushes a date range', async () => {
    stubWorkouts();
    const { result, router } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    result.setDateRange('2026-01-01', '2026-01-31');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ from: '2026-01-01', to: '2026-01-31' });
  });

  it('clears every filter', async () => {
    stubWorkouts();
    const { result, router } = await withRouter({ search: 'x' }, () => useWorkouts());
    await flushPromises();

    result.clearFilters();
    await flushPromises();
    expect(router.currentRoute.value.query.search).toBeUndefined();
  });

  it('rejects an out-of-range page', async () => {
    stubWorkouts();
    const { result, router } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    result.goToPage(0);
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBeUndefined();

    result.goToPage(1);
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBeUndefined();
  });

  it('pushes a valid page change', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/workouts/exercises')) return jsonResponse([]);
        return jsonResponse({ data: [], meta: { page: 1, limit: 20, total: 100, totalPages: 5 } });
      }),
    );
    const { result, router } = await withRouter({}, () => useWorkouts());
    await flushPromises();

    result.goToPage(2);
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe('2');
  });

  it('retries the workout list on demand', async () => {
    const fetchMock = stubWorkouts();
    const { result } = await withRouter({}, () => useWorkouts());
    await flushPromises();
    const before = fetchMock.mock.calls.length;

    result.retry();
    await flushPromises();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
  });
});
