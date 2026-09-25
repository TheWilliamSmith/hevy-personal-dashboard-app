import { describe, expect, it } from 'vitest';

import { flushPromises, withRouter } from '@/test/router-harness';

import { FULL_WIDTH_TABS, TABS, useActiveTab } from './useActiveTab';

describe('tab definitions', () => {
  it('exposes the seven tabs, dashboard first', () => {
    expect(TABS.map((tab) => tab.name)).toEqual([
      'dashboard',
      'body',
      'progress',
      'trophies',
      'workouts',
      'exercises',
      'data',
    ]);
  });

  it('gives the grid-based tabs the full viewport, and nothing else', () => {
    expect(FULL_WIDTH_TABS.has('dashboard')).toBe(true);
    expect(FULL_WIDTH_TABS.has('exercises')).toBe(true);
    expect(FULL_WIDTH_TABS.has('body')).toBe(true);
    expect(FULL_WIDTH_TABS.has('progress')).toBe(true);
    expect(FULL_WIDTH_TABS.has('trophies')).toBe(true);
    expect(FULL_WIDTH_TABS.has('workouts')).toBe(true);
    expect(FULL_WIDTH_TABS.has('data')).toBe(false);
  });
});

describe('useActiveTab', () => {
  it('defaults to the dashboard tab when the query has none', async () => {
    const { result } = await withRouter({}, () => useActiveTab());
    expect(result.tab.value).toBe('dashboard');
    expect(result.isFullWidth.value).toBe(true);
  });

  it('falls back to dashboard for an unknown tab value', async () => {
    const { result } = await withRouter({ tab: 'nonsense' }, () => useActiveTab());
    expect(result.tab.value).toBe('dashboard');
  });

  it('reads the tab from the query', async () => {
    const { result } = await withRouter({ tab: 'data' }, () => useActiveTab());
    expect(result.tab.value).toBe('data');
    expect(result.isFullWidth.value).toBe(false);
  });

  it('navigates to the given tab, clearing the query for dashboard', async () => {
    const { result, router } = await withRouter({ tab: 'data' }, () => useActiveTab());
    result.setTab('workouts');
    await flushPromises();
    expect(router.currentRoute.value.query.tab).toBe('workouts');

    result.setTab('dashboard');
    await flushPromises();
    expect(router.currentRoute.value.query.tab).toBeUndefined();
  });

  it('does nothing when setting the already-active tab', async () => {
    const { result, router } = await withRouter({ tab: 'workouts' }, () => useActiveTab());
    const before = router.currentRoute.value.fullPath;
    result.setTab('workouts');
    expect(router.currentRoute.value.fullPath).toBe(before);
  });
});
