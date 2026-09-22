import { describe, expect, it } from 'vitest';

import { dataVersion, invalidateWorkoutData, shouldBypassHttpCache } from './data-version';

describe('data invalidation', () => {
  it('does not bypass the HTTP cache until something is invalidated', () => {
    // This assertion depends on module state, so it runs before any bump.
    expect(dataVersion.value).toBe(0);
    expect(shouldBypassHttpCache()).toBe(false);
  });

  it('bumps the version so dependent watchers refetch', () => {
    const before = dataVersion.value;
    invalidateWorkoutData();
    expect(dataVersion.value).toBe(before + 1);
  });

  it('bypasses the HTTP cache once invalidated', () => {
    invalidateWorkoutData();
    expect(shouldBypassHttpCache()).toBe(true);
  });
});
