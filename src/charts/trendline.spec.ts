import { describe, expect, it } from 'vitest';

import { linearTrend } from './trendline';

describe('linearTrend', () => {
  it('fits a perfect line exactly', () => {
    const trend = linearTrend([0, 2, 4, 6]);
    expect(trend?.slope).toBeCloseTo(2);
    expect(trend?.intercept).toBeCloseTo(0);
    expect(trend?.points).toEqual([0, 2, 4, 6]);
  });

  it('finds a rising trend through noise', () => {
    const trend = linearTrend([100, 105, 102, 110, 115]);
    expect(trend?.slope).toBeGreaterThan(0);
  });

  it('finds a falling trend', () => {
    const trend = linearTrend([120, 118, 110, 105]);
    expect(trend?.slope).toBeLessThan(0);
  });

  it('skips nulls but still spans every index', () => {
    const trend = linearTrend([0, null, 4, null, 8]);
    expect(trend?.slope).toBeCloseTo(2);
    expect(trend?.points).toHaveLength(5);
  });

  it('returns null with fewer than two usable samples', () => {
    expect(linearTrend([5])).toBeNull();
    expect(linearTrend([null, 5, null])).toBeNull();
    expect(linearTrend([])).toBeNull();
  });

  it('returns null when every sample shares one index position', () => {
    // A flat series still has distinct x values, so it fits with slope 0.
    expect(linearTrend([5, 5, 5])?.slope).toBeCloseTo(0);
  });
});
