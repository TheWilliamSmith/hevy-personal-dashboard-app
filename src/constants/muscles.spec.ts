import { describe, expect, it } from 'vitest';

import { MUSCLE_LABELS, MUSCLE_ORDER, MUSCLE_STYLES, muscleRank } from './muscles';

describe('muscle constants', () => {
  it('covers every muscle group with a label and a style', () => {
    for (const group of MUSCLE_ORDER) {
      expect(MUSCLE_LABELS[group]).toBeTruthy();
      expect(MUSCLE_STYLES[group].hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('lists the anatomical order the API does not provide', () => {
    expect(MUSCLE_ORDER[0]).toBe('CHEST');
    expect(MUSCLE_ORDER.at(-1)).toBe('FULL_BODY');
    expect(MUSCLE_ORDER).toHaveLength(15);
  });

  it('has no duplicates', () => {
    expect(new Set(MUSCLE_ORDER).size).toBe(MUSCLE_ORDER.length);
  });

  it('ranks in anatomical, not alphabetical, order', () => {
    expect(muscleRank('CHEST')).toBeLessThan(muscleRank('ABS'));
    expect(muscleRank('BACK')).toBeLessThan(muscleRank('QUADS'));
  });
});
