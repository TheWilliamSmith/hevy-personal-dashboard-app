import { describe, expect, it } from 'vitest';

import type { AchievementItem } from '@/types/achievements';

import {
  describeAchievement,
  formatProgress,
  isInProgress,
  isMasked,
  ladderKey,
  ladderSizes,
  orderWithLadders,
  progressPercent,
} from './achievements';

function item(overrides: Partial<AchievementItem>): AchievementItem {
  return {
    code: 'X', family: 'VOLUME', tier: null, name: 'Name', description: 'Desc', flavor: null,
    icon: 'dumbbell', rarity: 'COMMON', xp: 50, secret: false, unlocked: false,
    unlockedAt: null, workoutId: null, progress: null, ...overrides,
  };
}

describe('ladders', () => {
  it('keys a tiered code by its prefix, an untiered one by its code', () => {
    expect(ladderKey(item({ code: 'VOLUME_50T', tier: 5 }))).toBe('VOLUME');
    expect(ladderKey(item({ code: 'BENCH_100', tier: 2 }))).toBe('BENCH');
    expect(ladderKey(item({ code: 'PR_TRIPLE', tier: null }))).toBe('PR_TRIPLE');
  });

  it('puts a ladder\'s tiers next to each other, lowest first', () => {
    const ordered = orderWithLadders([
      item({ code: 'BENCH_140', tier: 3 }),
      item({ code: 'PR_10' }),
      item({ code: 'BENCH_60', tier: 1 }),
      item({ code: 'BENCH_100', tier: 2 }),
    ]);
    expect(ordered.map((entry) => entry.code)).toEqual(['BENCH_60', 'BENCH_100', 'BENCH_140', 'PR_10']);
  });

  it('knows how many pips each ladder has', () => {
    const sizes = ladderSizes([item({ code: 'BENCH_60', tier: 1 }), item({ code: 'BENCH_140', tier: 3 })]);
    expect(sizes.get('BENCH')).toBe(3);
  });
});

describe('formatProgress', () => {
  it('names the unit from the ladder', () => {
    expect(formatProgress(item({ code: 'VOLUME_50T', tier: 5, progress: { value: 43200, target: 50000 } })))
      .toBe('43,2 / 50 t');
    expect(formatProgress(item({ code: 'TIME_24H', tier: 1, progress: { value: 36000, target: 86400 } })))
      .toBe('10 / 24 h');
    expect(formatProgress(item({ code: 'CARDIO_42', tier: 1, progress: { value: 12.5, target: 42.2 } })))
      .toBe('12,5 / 42,2 km');
  });

  it('prefers the longest prefix, so single-session volume is not VOLUME', () => {
    expect(formatProgress(item({ code: 'SESSION_VOLUME_10T', progress: { value: 7500, target: 10000 } })))
      .toBe('7,5 / 10 t');
  });

  it('falls back to a plain count for unknown codes', () => {
    expect(formatProgress(item({ code: 'EXPLORER_20', tier: 1, progress: { value: 12, target: 20 } })))
      .toBe('12 / 20');
  });

  it('uses plain spaces as the thousands separator', () => {
    expect(formatProgress(item({ code: 'REPS_10K', progress: { value: 4200, target: 10000 } })))
      .toBe('4 200 / 10 000');
  });
});

describe('progress state', () => {
  it('clamps an overshooting snapshot to 100', () => {
    expect(progressPercent(item({ progress: { value: 120, target: 100 } }))).toBe(100);
  });

  it('is in progress only when started and still locked', () => {
    expect(isInProgress(item({ progress: { value: 3, target: 10 } }))).toBe(true);
    expect(isInProgress(item({ progress: { value: 0, target: 10 } }))).toBe(false);
    expect(isInProgress(item({ unlocked: true, progress: { value: 10, target: 10 } }))).toBe(false);
  });
});

describe('describeAchievement', () => {
  it('says nothing about a masked secret beyond it being hidden', () => {
    const secret = item({ secret: true, name: '???', rarity: 'EPIC', xp: 400 });
    expect(isMasked(secret)).toBe(true);
    const label = describeAchievement(secret);
    expect(label).toBe('Hidden achievement, locked');
    expect(label).not.toContain('Epic');
    expect(label).not.toContain('400');
  });

  it('includes state, rarity and progress', () => {
    const label = describeAchievement(item({
      name: 'Fifty Tonnes', code: 'VOLUME_50T', tier: 5, rarity: 'RARE',
      progress: { value: 43200, target: 50000 },
    }));
    expect(label).toContain('locked');
    expect(label).toContain('tier 5');
    expect(label).toContain('43,2 / 50 t, 86 percent');
  });

  it('describes a negative achievement as a warning, without XP', () => {
    const label = describeAchievement(item({ name: 'Leg Day Denier', xp: 0, unlocked: true }));
    expect(label).toContain('warning, triggered');
    expect(label).not.toContain('XP');
  });
});
