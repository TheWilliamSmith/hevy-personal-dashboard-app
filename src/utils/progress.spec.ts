import { describe, expect, it } from 'vitest';

import { EMPTY } from './format';
import {
  formatDaysAgo,
  formatGapToBest,
  formatMetricValue,
  formatSlope,
  formatWeeksAgo,
  gapToBestPct,
} from './progress';

describe('formatMetricValue', () => {
  it('renders each metric in its own unit', () => {
    expect(formatMetricValue('est1RM', 87.5)).toBe('87,5 kg');
    expect(formatMetricValue('totalReps', 24)).toBe('24 reps');
    expect(formatMetricValue('distancePerMinute', 0.183)).toBe('0,183 km/min');
    expect(formatMetricValue('longestHoldSeconds', 90)).toBe('1:30');
    expect(formatMetricValue('longestHoldSeconds', 45)).toBe('45 s');
  });

  it('renders null as an em dash', () => {
    expect(formatMetricValue('est1RM', null)).toBe(EMPTY);
  });
});

describe('formatSlope', () => {
  it('signs the slope', () => {
    expect(formatSlope(1.2)).toBe('+1,2 %/week');
    expect(formatSlope(-0.8)).toBe('-0,8 %/week');
    expect(formatSlope(0)).toBe('+0 %/week');
  });

  it('renders a missing slope as an em dash', () => {
    expect(formatSlope(null)).toBe(EMPTY);
  });
});

describe('formatGapToBest', () => {
  it('rounds the gap and says so when at best', () => {
    expect(formatGapToBest(-4.2)).toBe('-4 % vs best');
    expect(formatGapToBest(0)).toBe('at best');
    expect(formatGapToBest(-0.3)).toBe('at best');
  });
});

describe('relative time', () => {
  it('reads naturally for days', () => {
    expect(formatDaysAgo(0)).toBe('today');
    expect(formatDaysAgo(1)).toBe('yesterday');
    expect(formatDaysAgo(5)).toBe('5 days ago');
  });

  it('switches to weeks after two weeks', () => {
    expect(formatDaysAgo(21)).toBe('3 weeks ago');
  });

  it('singularises one week', () => {
    expect(formatWeeksAgo(1)).toBe('1 week ago');
    expect(formatWeeksAgo(9)).toBe('9 weeks ago');
    expect(formatWeeksAgo(0)).toBe('this week');
  });

  it('renders null as an em dash', () => {
    expect(formatDaysAgo(null)).toBe(EMPTY);
    expect(formatWeeksAgo(null)).toBe(EMPTY);
  });
});

describe('gapToBestPct', () => {
  const ref = (value: number) => ({ value, date: '2026-09-10T10:00:00.000Z', workoutId: 'w' });

  it('is negative when below the all-time best', () => {
    expect(gapToBestPct({ current: ref(96), best: ref(100) })).toBeCloseTo(-4);
  });

  it('is 0 at the best', () => {
    expect(gapToBestPct({ current: ref(100), best: ref(100) })).toBe(0);
  });

  it('is null when either side is missing or the best is 0', () => {
    expect(gapToBestPct({ current: null, best: ref(100) })).toBeNull();
    expect(gapToBestPct({ current: ref(5), best: null })).toBeNull();
    expect(gapToBestPct({ current: ref(5), best: ref(0) })).toBeNull();
  });
});
