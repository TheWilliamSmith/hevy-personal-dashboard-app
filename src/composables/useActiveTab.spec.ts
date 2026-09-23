import { describe, expect, it } from 'vitest';

import { FULL_WIDTH_TABS, TABS } from './useActiveTab';

describe('tab definitions', () => {
  it('exposes the seven tabs, dashboard first', () => {
    expect(TABS.map((tab) => tab.name)).toEqual([
      'dashboard',
      'body',
      'progress',
      'trophies',
      'workouts',
      'exercises',
      'imports',
    ]);
  });

  it('gives the grid-based tabs the full viewport, and nothing else', () => {
    expect(FULL_WIDTH_TABS.has('dashboard')).toBe(true);
    expect(FULL_WIDTH_TABS.has('exercises')).toBe(true);
    expect(FULL_WIDTH_TABS.has('body')).toBe(true);
    expect(FULL_WIDTH_TABS.has('progress')).toBe(true);
    expect(FULL_WIDTH_TABS.has('trophies')).toBe(true);
    expect(FULL_WIDTH_TABS.has('workouts')).toBe(true);
    expect(FULL_WIDTH_TABS.has('imports')).toBe(false);
  });
});
