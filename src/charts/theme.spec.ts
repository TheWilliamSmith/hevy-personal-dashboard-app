import { describe, expect, it } from 'vitest';

import {
  DARK_PALETTE,
  LIGHT_PALETTE,
  baseOption,
  categoryAxis,
  formatAxisValue,
  formatMetric,
  resolveTheme,
  valueAxis,
} from './theme';

describe('resolveTheme', () => {
  it('returns the light palette by default', () => {
    expect(resolveTheme()).toBe(LIGHT_PALETTE);
  });

  it('returns the dark palette when asked', () => {
    expect(resolveTheme(true)).toBe(DARK_PALETTE);
  });
});

describe('formatMetric', () => {
  it('formats volume in kg', () => {
    expect(formatMetric('volume', 1234)).toContain('kg');
  });

  it('formats duration', () => {
    expect(formatMetric('duration', 90)).toBe('1 min');
  });

  it('formats other metrics with their unit', () => {
    expect(formatMetric('sets', 12)).toBe('12 sets');
    expect(formatMetric('reps', 8)).toBe('8 reps');
    expect(formatMetric('workouts', 3)).toBe('3 workouts');
  });
});

describe('formatAxisValue', () => {
  it('formats duration on the axis', () => {
    expect(formatAxisValue('duration', 61)).toBe('1 min');
  });

  it('abbreviates large values with a k suffix', () => {
    expect(formatAxisValue('volume', 12345)).toContain('k');
  });

  it('keeps small values as-is', () => {
    expect(formatAxisValue('sets', 42)).toBe('42');
  });
});

describe('baseOption', () => {
  it('builds a base chart option from the palette', () => {
    const option = baseOption(LIGHT_PALETTE);
    expect(option.animationDuration).toBe(240);
    expect(option.tooltip).toBeDefined();
  });
});

describe('categoryAxis / valueAxis', () => {
  it('builds a category axis', () => {
    expect(categoryAxis(LIGHT_PALETTE).type).toBe('category');
  });

  it('builds a value axis with an optional name', () => {
    const axis = valueAxis(LIGHT_PALETTE, 'kg');
    expect(axis.type).toBe('value');
    expect(axis.name).toBe('kg');
  });
});
