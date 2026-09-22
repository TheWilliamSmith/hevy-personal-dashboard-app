import { describe, expect, it } from 'vitest';

import { FULL_WIDTH_TABS, TABS } from './useActiveTab';

describe('tab definitions', () => {
  it('exposes the four tabs, dashboard first', () => {
    expect(TABS.map((tab) => tab.name)).toEqual([
      'dashboard',
      'workouts',
      'exercises',
      'imports',
    ]);
  });

  it('gives the grid-based tabs the full viewport, and nothing else', () => {
    expect(FULL_WIDTH_TABS.has('dashboard')).toBe(true);
    expect(FULL_WIDTH_TABS.has('exercises')).toBe(true);
    expect(FULL_WIDTH_TABS.has('workouts')).toBe(false);
    expect(FULL_WIDTH_TABS.has('imports')).toBe(false);
  });
});
