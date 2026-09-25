import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse, withRouter } from '@/test/router-harness';
import type { ProgressItem } from '@/types/progress';

import { useProgressAlerts } from './useProgressAlerts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function progressItem(overrides: Partial<ProgressItem> = {}): ProgressItem {
  return {
    exerciseId: 'e1',
    name: 'Bench Press',
    slug: 'bench-press',
    muscleGroup: 'CHEST',
    equipment: 'BARBELL',
    kind: 'STRENGTH',
    status: 'REGRESSING',
    metricUsed: 'est1RM',
    slopePctPerWeek: -2,
    sessionsAnalyzed: 6,
    current: { value: 100, date: '2026-09-01', workoutId: 'w1' },
    best: { value: 110, date: '2026-08-01', workoutId: 'w0' },
    weeksSincePR: 4,
    sessionsSinceImprovement: 3,
    lastPerformedAt: '2026-09-01',
    daysSinceLast: 3,
    sessions: [],
    avgSetsPerSession: 3,
    weeklySetsAvg: 4,
    ...overrides,
  };
}

const response = {
  params: { windowWeeks: 12, sessions: 6, staleWeeks: 4, threshold: 0.5 },
  counts: { REGRESSING: 1, PLATEAU: 1, STALE: 0, PROGRESSING: 1, NOT_ENOUGH_DATA: 0 },
  items: [
    progressItem({
      exerciseId: 'e1', name: 'Bench Press', status: 'REGRESSING', slopePctPerWeek: -2,
      weeksSincePR: 4, daysSinceLast: 3,
      current: { value: 100, date: '2026-09-01', workoutId: 'w1' },
      best: { value: 110, date: '2026-08-01', workoutId: 'w0' },
    }),
    progressItem({
      exerciseId: 'e2', name: 'Squat', status: 'PLATEAU', slopePctPerWeek: 0.1,
      weeksSincePR: 1, daysSinceLast: 1,
      current: { value: 105, date: '2026-09-01', workoutId: 'w1' },
      best: { value: 100, date: '2026-08-01', workoutId: 'w0' },
    }),
    progressItem({
      exerciseId: 'e3', name: 'Deadlift', status: 'PROGRESSING', slopePctPerWeek: 5,
      weeksSincePR: null, daysSinceLast: 10,
      current: { value: 90, date: '2026-09-01', workoutId: 'w1' },
      best: { value: 100, date: '2026-08-01', workoutId: 'w0' },
    }),
  ],
  muted: [{ exerciseId: 'e9', name: 'Curl', slug: 'curl', muteReason: null }],
};

function stubAlerts() {
  const fetchMock = vi.fn(async () => jsonResponse(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useProgressAlerts', () => {
  it('loads alerts with the default params', async () => {
    stubAlerts();
    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();

    expect(result.hasLoaded.value).toBe(true);
    expect(result.counts.value).toEqual(response.counts);
    expect(result.total.value).toBe(3);
    expect(result.visible.value).toHaveLength(3);
    expect(result.muted.value).toEqual(response.muted);
    expect(result.isDefault.value).toBe(true);
  });

  it('reads and clamps params from the query', async () => {
    stubAlerts();
    const { result } = await withRouter(
      { window: '26w', sessions: '999', staleWeeks: '0', threshold: '99', muscleGroup: 'CHEST' },
      () => useProgressAlerts(),
    );
    await flushPromises();

    expect(result.draft.window).toBe('26w');
    expect(result.draft.sessions).toBe(10);
    expect(result.draft.staleWeeks).toBe(2);
    expect(result.draft.threshold).toBe(3);
    expect(result.draft.muscleGroup).toBe('CHEST');
    expect(result.isDefault.value).toBe(false);
  });

  it('falls back to defaults for garbage numeric input', async () => {
    stubAlerts();
    const { result } = await withRouter({ sessions: 'abc', threshold: 'nope' }, () => useProgressAlerts());
    await flushPromises();
    expect(result.draft.sessions).toBe(6);
    expect(result.draft.threshold).toBe(0.5);
  });

  it('filters visible items by status', async () => {
    stubAlerts();
    const { result } = await withRouter({ status: 'PLATEAU' }, () => useProgressAlerts());
    await flushPromises();

    expect(result.visible.value.map((item) => item.exerciseId)).toEqual(['e2']);
  });

  it('ignores an invalid status in the query', async () => {
    stubAlerts();
    const { result } = await withRouter({ status: 'nonsense' }, () => useProgressAlerts());
    await flushPromises();
    expect(result.status.value).toBeNull();
  });

  it.each([
    ['name', ['Bench Press', 'Deadlift', 'Squat']],
    ['slope', ['e1', 'e2', 'e3']],
    ['gap', ['e3', 'e1', 'e2']],
    ['lastPR', ['e1', 'e2', 'e3']],
    ['lastDone', ['e3', 'e1', 'e2']],
  ])('sorts visible items by %s', async (sort, expected) => {
    stubAlerts();
    const { result } = await withRouter({ sort }, () => useProgressAlerts());
    await flushPromises();

    if (sort === 'name') {
      expect(result.visible.value.map((item) => item.name)).toEqual(expected);
    } else {
      expect(result.visible.value.map((item) => item.exerciseId)).toEqual(expected);
    }
  });

  it('falls back to the server order for the default priority sort', async () => {
    stubAlerts();
    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();
    expect(result.sort.value).toBe('priority');
    expect(result.visible.value.map((item) => item.exerciseId)).toEqual(['e1', 'e2', 'e3']);
  });

  it('ignores an invalid sort value', async () => {
    stubAlerts();
    const { result } = await withRouter({ sort: 'nonsense' }, () => useProgressAlerts());
    await flushPromises();
    expect(result.sort.value).toBe('priority');
  });

  it('pushes status and sort changes to the query', async () => {
    stubAlerts();
    const { result, router } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();

    result.setStatus('PLATEAU');
    await flushPromises();
    expect(router.currentRoute.value.query.status).toBe('PLATEAU');

    result.setStatus(null);
    await flushPromises();
    expect(router.currentRoute.value.query.status).toBeUndefined();

    result.setSort('name');
    await flushPromises();
    expect(router.currentRoute.value.query.sort).toBe('name');

    result.setSort('priority');
    await flushPromises();
    expect(router.currentRoute.value.query.sort).toBeUndefined();
  });

  it('debounces draft updates and pushes only the changed params', async () => {
    vi.useFakeTimers();
    stubAlerts();
    const { result, router } = await withRouter({}, () => useProgressAlerts());
    await vi.advanceTimersByTimeAsync(0);

    result.updateDraft({ sessions: 8 });
    await vi.advanceTimersByTimeAsync(250);

    expect(router.currentRoute.value.query.sessions).toBe('8');
    expect(router.currentRoute.value.query.window).toBeUndefined();
  });

  it('resets to defaults immediately, bypassing the debounce', async () => {
    vi.useFakeTimers();
    stubAlerts();
    const { result, router } = await withRouter({ sessions: '9' }, () => useProgressAlerts());
    await vi.advanceTimersByTimeAsync(0);

    result.resetDefaults();
    await vi.advanceTimersByTimeAsync(0);

    expect(router.currentRoute.value.query.sessions).toBeUndefined();
    expect(result.draft.muscleGroup).toBeNull();
  });

  it('mutes an exercise optimistically and confirms with the server', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({ exerciseId: 'e1', muted: true, muteReason: null });
      return jsonResponse(response);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();

    const ok = await result.mute(response.items[0]!, 'plateaued');
    expect(ok).toBe(true);
    expect(result.mutingId.value).toBeNull();
  });

  it('rolls back an optimistic mute on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'PATCH') return jsonResponse({ message: 'cannot mute' }, 400);
        return jsonResponse(response);
      }),
    );

    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();

    const ok = await result.mute(response.items[0]!, null);
    expect(ok).toBe(false);
    expect(result.muteError.value).toBe('cannot mute');
    expect(result.visible.value.some((item) => item.exerciseId === 'e1')).toBe(true);
  });

  it('unmutes an exercise and refreshes', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({ exerciseId: 'e9', muted: false, muteReason: null });
      return jsonResponse(response);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();

    const ok = await result.unmute(response.muted[0]!);
    expect(ok).toBe(true);
  });

  it('rolls back an optimistic unmute on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'PATCH') return jsonResponse({ message: 'cannot unmute' }, 400);
        return jsonResponse(response);
      }),
    );

    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();

    const ok = await result.unmute(response.muted[0]!);
    expect(ok).toBe(false);
    expect(result.muteError.value).toBe('cannot unmute');
  });

  it('mute/unmute are no-ops before the first load resolves', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { result } = await withRouter({}, () => useProgressAlerts());

    expect(await result.mute(progressItem(), null)).toBe(false);
    expect(await result.unmute({ exerciseId: 'e9', name: 'Curl', slug: 'curl', muteReason: null })).toBe(false);
  });

  it('surfaces a fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'bad' }, 400)));
    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();
    expect(result.error.value).toBe('bad');
  });

  it('re-fetches when refresh is called', async () => {
    const fetchMock = stubAlerts();
    const { result } = await withRouter({}, () => useProgressAlerts());
    await flushPromises();
    const before = fetchMock.mock.calls.length;

    result.refresh();
    await flushPromises();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
  });
});
