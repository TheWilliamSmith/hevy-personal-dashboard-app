import { describe, expect, it } from 'vitest';

import {
  estimateOneRepMax,
  percentageTable,
  PLATE_SETUPS,
  platesPerSide,
  repsAtPercentage,
  roundToIncrement,
} from '@/utils/calculators';

describe('estimateOneRepMax', () => {
  it('uses the Epley formula, like the API', () => {
    expect(estimateOneRepMax(100, 1)).toBeCloseTo(103.333, 3);
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 3);
    expect(estimateOneRepMax(225, 8)).toBeCloseTo(285, 3);
  });

  it('needs a positive weight and reps', () => {
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(Number.NaN, 5)).toBeNull();
  });
});

describe('percentage table', () => {
  it('rounds every percentage to the plate increment and estimates the reps', () => {
    const rows = percentageTable(140, 2.5);

    expect(rows.map((row) => row.percent)).toEqual([100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]);
    expect(rows[0]).toEqual({ percent: 100, weight: 140, reps: 1 });
    expect(rows[2]).toEqual({ percent: 90, weight: 125, reps: 3 });
    expect(rows[4]).toEqual({ percent: 80, weight: 112.5, reps: 8 });
    expect(rows[10]).toEqual({ percent: 50, weight: 70, reps: 30 });
  });

  it('works in pounds with 5 lb steps', () => {
    expect(percentageTable(315, 5)[4]).toEqual({ percent: 80, weight: 250, reps: 8 });
  });

  it('is empty without a 1RM', () => {
    expect(percentageTable(0, 2.5)).toEqual([]);
  });

  it('turns a percentage into reps and rounds to increments', () => {
    expect(repsAtPercentage(95)).toBe(2);
    expect(repsAtPercentage(75)).toBe(10);
    expect(roundToIncrement(101.2, 2.5)).toBe(100);
    expect(roundToIncrement(103.8, 2.5)).toBe(105);
  });
});

describe('platesPerSide', () => {
  it('loads the biggest plates first', () => {
    expect(platesPerSide(100, 20, PLATE_SETUPS.kg.plates)).toEqual({ perSide: [25, 15], achieved: 100, remainder: 0, belowBar: false });
    expect(platesPerSide(142.5, 20, PLATE_SETUPS.kg.plates)).toEqual({
      perSide: [25, 25, 10, 1.25],
      achieved: 142.5,
      remainder: 0,
      belowBar: false,
    });
    expect(platesPerSide(225, 45, PLATE_SETUPS.lb.plates).perSide).toEqual([45, 45]);
  });

  it('says what is left when the plates cannot make the target', () => {
    expect(platesPerSide(101, 20, PLATE_SETUPS.kg.plates)).toEqual({ perSide: [25, 15], achieved: 100, remainder: 1, belowBar: false });
    expect(platesPerSide(100, 20, [20])).toEqual({ perSide: [20, 20], achieved: 100, remainder: 0, belowBar: false });
    expect(platesPerSide(90, 20, [20])).toEqual({ perSide: [20], achieved: 60, remainder: 30, belowBar: false });
  });

  it('handles the empty bar and a target below it', () => {
    expect(platesPerSide(20, 20, PLATE_SETUPS.kg.plates)).toEqual({ perSide: [], achieved: 20, remainder: 0, belowBar: false });
    expect(platesPerSide(15, 20, PLATE_SETUPS.kg.plates)).toEqual({ perSide: [], achieved: 20, remainder: 0, belowBar: true });
  });
});
