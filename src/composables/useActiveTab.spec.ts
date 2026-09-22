import { describe, expect, it } from 'vitest';

import { FULL_WIDTH_TABS, TABS } from './useActiveTab';

describe('tab definitions', () => {
  it('exposes exactly the three tabs, dashboard first', () => {
    expect(TABS.map((tab) => tab.name)).toEqual(['dashboard', 'workouts', 'imports']);
  });

  it('gives the dashboard the full viewport and nothing else', () => {
    expect(FULL_WIDTH_TABS.has('dashboard')).toBe(true);
    expect(FULL_WIDTH_TABS.has('workouts')).toBe(false);
    expect(FULL_WIDTH_TABS.has('imports')).toBe(false);
  });
});
