// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { computed } from 'vue';

import { formatProgress } from '@/utils/achievements';
import {
  formatLoad,
  formatVolume,
  formatWeight,
  fromDisplayWeight,
  LB_PER_KG,
  toDisplayWeight,
  weightUnitLabel,
} from '@/utils/format';
import { applyPreferences, weekStart, weightUnit } from '@/utils/preferences';
import { formatMetricValue } from '@/utils/progress';
import type { AchievementItem } from '@/types/achievements';

const POUNDS = { weightUnit: 'lb', weekStart: 'monday' } as const;

describe('weight unit', () => {
  it('shows kilograms by default', () => {
    expect(weightUnitLabel()).toBe('kg');
    expect(formatVolume(1250)).toBe('1,250 kg');
    expect(formatWeight(102.5)).toBe('102.5');
    expect(formatLoad(102.5)).toBe('102.5 kg');
    expect(formatLoad(null)).toBe('—');
  });

  it('converts every weight to pounds', () => {
    applyPreferences(POUNDS);

    expect(weightUnitLabel()).toBe('lb');
    expect(formatVolume(1000)).toBe('2,204.6 lb');
    expect(formatWeight(100)).toBe('220.5');
    expect(formatLoad(100)).toBe('220.5 lb');
    expect(formatMetricValue('est1RM', 140)).toBe('308.6 lb');
  });

  it('converts typed pounds back to kilograms', () => {
    applyPreferences(POUNDS);

    expect(toDisplayWeight(100)).toBeCloseTo(220.462, 3);
    expect(fromDisplayWeight(225)).toBeCloseTo(102.058, 3);
    expect(fromDisplayWeight(toDisplayWeight(87.5))).toBeCloseTo(87.5, 9);
    expect(LB_PER_KG).toBeCloseTo(2.20462, 5);
  });

  it('leaves kilograms untouched', () => {
    expect(toDisplayWeight(100)).toBe(100);
    expect(fromDisplayWeight(100)).toBe(100);
  });

  it('converts trophy progress for weight ladders only', () => {
    const item = (code: string, value: number, target: number) =>
      ({ code, tier: 1, progress: { value, target } }) as unknown as AchievementItem;
    applyPreferences(POUNDS);

    expect(formatProgress(item('BENCH_100', 90, 100))).toBe('198.4 / 220.5 lb');
    expect(formatProgress(item('VOLUME_50T', 43200, 50000))).toBe('95.2 / 110.2 k lb');
    expect(formatProgress(item('CARDIO_42', 12.5, 42.2))).toBe('12.5 / 42.2 km');
  });

  it('updates computed values when the preference changes, without reloading', () => {
    const label = computed(() => formatVolume(500));
    expect(label.value).toBe('500 kg');

    applyPreferences(POUNDS);
    expect(label.value).toBe('1,102.3 lb');
  });

  it('remembers the preferences in the browser', () => {
    applyPreferences({ weightUnit: 'lb', weekStart: 'sunday' });

    expect(JSON.parse(localStorage.getItem('hevy-dashboard.preferences') ?? '{}')).toEqual({ weightUnit: 'lb', weekStart: 'sunday', theme: 'system' });
    expect(weightUnit.value).toBe('lb');
    expect(weekStart.value).toBe('sunday');
  });
});
