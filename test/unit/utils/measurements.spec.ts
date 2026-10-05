import { describe, expect, it } from 'vitest';

import type { Measurement } from '@/types/measurements';
import { bodyweightOn, relativeStrength, summarize, withValue } from '@/utils/measurements';

function entry(measuredOn: string, values: Partial<Measurement> = {}): Measurement {
  return { id: measuredOn, measuredOn, weightKg: null, armCm: null, waistCm: null, thighCm: null, chestCm: null, ...values };
}

const ENTRIES = [
  entry('2026-09-01', { weightKg: 80.5, waistCm: 84 }),
  entry('2026-07-01', { weightKg: 83 }),
  entry('2026-08-03', { weightKg: 82, armCm: 37 }),
  entry('2026-09-20', { armCm: 37.5 }),
  entry('2026-10-01', { weightKg: 79.8 }),
];

describe('withValue', () => {
  it('keeps the entries that have the value, oldest first', () => {
    expect(withValue(ENTRIES, 'weightKg').map((item) => item.measuredOn)).toEqual(['2026-07-01', '2026-08-03', '2026-09-01', '2026-10-01']);
    expect(withValue(ENTRIES, 'thighCm')).toEqual([]);
  });
});

describe('bodyweightOn', () => {
  it('uses the last weight on or before the day', () => {
    expect(bodyweightOn('2026-09-15T18:00:00.000Z', ENTRIES, 90)).toBe(80.5);
    expect(bodyweightOn('2026-09-01', ENTRIES, 90)).toBe(80.5);
    expect(bodyweightOn('2026-12-01', ENTRIES, 90)).toBe(79.8);
  });

  it('falls back to the first weight, then to the profile weight', () => {
    expect(bodyweightOn('2026-01-01', ENTRIES, 90)).toBe(83);
    expect(bodyweightOn('2026-01-01', [entry('2026-03-01', { armCm: 36 })], 90)).toBe(90);
    expect(bodyweightOn('2026-01-01', [], null)).toBeNull();
  });
});

describe('relativeStrength', () => {
  it('divides the estimated 1RM by the bodyweight', () => {
    expect(relativeStrength(102, 79.8)).toBe(1.28);
    expect(relativeStrength(160, 80)).toBe(2);
  });

  it('needs both values', () => {
    expect(relativeStrength(null, 80)).toBeNull();
    expect(relativeStrength(100, null)).toBeNull();
    expect(relativeStrength(0, 80)).toBeNull();
  });
});

describe('summarize', () => {
  it('compares the latest value with the one closest to 30 days before', () => {
    expect(summarize(ENTRIES, 'weightKg')).toEqual({ latest: ENTRIES[4], change: -0.7, since: '2026-09-01' });
    expect(summarize(ENTRIES, 'armCm')).toEqual({ latest: ENTRIES[3], change: 0.5, since: '2026-08-03' });
  });

  it('has no change with a single value or none', () => {
    expect(summarize(ENTRIES, 'waistCm')).toEqual({ latest: ENTRIES[0], change: null, since: null });
    expect(summarize(ENTRIES, 'chestCm')).toEqual({ latest: null, change: null, since: null });
  });
});
