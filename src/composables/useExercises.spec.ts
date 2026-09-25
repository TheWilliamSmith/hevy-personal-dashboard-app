import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse, withRouter } from '@/test/router-harness';

import { useExercises } from './useExercises';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const catalog = {
  groups: [
    {
      muscleGroup: 'CHEST',
      exerciseCount: 1,
      totalSets: 5,
      exercises: [{ id: 'e1', name: 'Bench Press', sessions: 3, totalSets: 5 }],
    },
    {
      muscleGroup: 'BACK',
      exerciseCount: 1,
      totalSets: 0,
      exercises: [{ id: 'e2', name: 'Row', sessions: 0, totalSets: 0 }],
    },
  ],
  totals: { exercises: 2, performed: 1, neverPerformed: 1 },
};

function stubCatalog() {
  const fetchMock = vi.fn(async () => jsonResponse(catalog));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useExercises', () => {
  it('loads the exercise catalog, sorted by muscle order', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useExercises());
    await flushPromises();

    expect(result.groups.value.map((g) => g.muscleGroup)).toEqual(['CHEST', 'BACK']);
    expect(result.totals.value).toEqual(catalog.totals);
    expect(result.isEmptyCatalog.value).toBe(false);
  });

  it('reads filters from the query', async () => {
    stubCatalog();
    const { result } = await withRouter(
      { q: 'bench', muscles: 'CHEST,BACK', equipment: 'BARBELL', kind: 'STRENGTH', sortBy: 'volume', performed: '1' },
      () => useExercises(),
    );
    await flushPromises();

    expect(result.filters.value).toMatchObject({
      search: 'bench',
      muscleGroups: ['CHEST', 'BACK'],
      equipment: 'BARBELL',
      kind: 'STRENGTH',
      sortBy: 'volume',
      hideNeverPerformed: true,
    });
    expect(result.hasActiveFilters.value).toBe(true);
  });

  it('falls back to name sort for an unknown value', async () => {
    stubCatalog();
    const { result } = await withRouter({ sortBy: 'bogus' }, () => useExercises());
    await flushPromises();
    expect(result.filters.value.sortBy).toBe('name');
  });

  it('filters out groups with no exercises left, e.g. hiding never-performed', async () => {
    stubCatalog();
    const { result } = await withRouter({ performed: '1' }, () => useExercises());
    await flushPromises();

    expect(result.groups.value.map((g) => g.muscleGroup)).toEqual(['CHEST']);
  });

  it('has no active filters by default', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useExercises());
    await flushPromises();
    expect(result.hasActiveFilters.value).toBe(false);
  });

  it('flags an empty catalog', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ groups: [], totals: { exercises: 0, performed: 0, neverPerformed: 0 } })));
    const { result } = await withRouter({}, () => useExercises());
    await flushPromises();
    expect(result.isEmptyCatalog.value).toBe(true);
  });

  it('surfaces an error and clears the catalog on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'bad' }, 400)));
    const { result } = await withRouter({}, () => useExercises());
    await flushPromises();
    expect(result.error.value).toBe('bad');
    expect(result.groups.value).toEqual([]);
  });

  it('debounces the search and pushes it to the query', async () => {
    vi.useFakeTimers();
    stubCatalog();
    const { result, router } = await withRouter({}, () => useExercises());
    await vi.advanceTimersByTimeAsync(0);

    result.setSearch('press');
    await vi.advanceTimersByTimeAsync(300);

    expect(router.currentRoute.value.query.q).toBe('press');
  });

  it('toggles a muscle group filter on and off', async () => {
    stubCatalog();
    const { result, router } = await withRouter({}, () => useExercises());
    await flushPromises();

    result.toggleMuscle('CHEST');
    await flushPromises();
    expect(router.currentRoute.value.query.muscles).toBe('CHEST');

    result.toggleMuscle('CHEST');
    await flushPromises();
    expect(router.currentRoute.value.query.muscles).toBeUndefined();
  });

  it('sets equipment, kind and sort', async () => {
    stubCatalog();
    const { result, router } = await withRouter({}, () => useExercises());
    await flushPromises();

    result.setEquipment('BARBELL');
    await flushPromises();
    expect(router.currentRoute.value.query.equipment).toBe('BARBELL');

    result.setKind('CARDIO');
    await flushPromises();
    expect(router.currentRoute.value.query.kind).toBe('CARDIO');

    result.setSortBy('volume');
    await flushPromises();
    expect(router.currentRoute.value.query.sortBy).toBe('volume');

    result.setSortBy('name');
    await flushPromises();
    expect(router.currentRoute.value.query.sortBy).toBeUndefined();
  });

  it('toggles hiding never-performed exercises', async () => {
    stubCatalog();
    const { result, router } = await withRouter({}, () => useExercises());
    await flushPromises();

    result.toggleHideNeverPerformed();
    await flushPromises();
    expect(router.currentRoute.value.query.performed).toBe('1');
  });

  it('clears every filter', async () => {
    stubCatalog();
    const { result, router } = await withRouter({ q: 'x' }, () => useExercises());
    await flushPromises();

    result.clearFilters();
    await flushPromises();
    expect(router.currentRoute.value.query.q).toBeUndefined();
  });

  it('re-fetches when refresh is called', async () => {
    const fetchMock = stubCatalog();
    const { result } = await withRouter({}, () => useExercises());
    await flushPromises();
    const before = fetchMock.mock.calls.length;

    result.refresh();
    await flushPromises();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
  });
});
