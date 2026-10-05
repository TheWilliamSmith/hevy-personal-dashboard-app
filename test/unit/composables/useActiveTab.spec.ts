import { describe, expect, it } from 'vitest';

import { flushPromises, withRouter } from '../../support/router-harness';

import { TABS, useActiveTab } from '@/composables/useActiveTab';

describe('tab definitions', () => {
  it('exposes the eleven tabs, dashboard first', () => {
    expect(TABS.map((tab) => tab.name)).toEqual([
      'dashboard',
      'body',
      'measurements',
      'progress',
      'goals',
      'trophies',
      'workouts',
      'exercises',
      'calculators',
      'friends',
      'settings',
    ]);
  });
});

describe('useActiveTab', () => {
  it('defaults to the dashboard tab when the query has none', async () => {
    const { result } = await withRouter({}, () => useActiveTab());
    expect(result.tab.value).toBe('dashboard');
  });

  it('falls back to dashboard for an unknown tab value', async () => {
    const { result } = await withRouter({ tab: 'nonsense' }, () => useActiveTab());
    expect(result.tab.value).toBe('dashboard');
  });

  it('reads the tab from the query', async () => {
    const { result } = await withRouter({ tab: 'settings' }, () => useActiveTab());
    expect(result.tab.value).toBe('settings');
  });

  it('navigates to the given tab, clearing the query for dashboard', async () => {
    const { result, router } = await withRouter({ tab: 'settings' }, () => useActiveTab());
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
