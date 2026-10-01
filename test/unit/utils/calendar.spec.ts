import { describe, expect, it } from 'vitest';

import { buildCalendarGrid, rollingSum, yearsBetween } from '@/utils/calendar';

const TUESDAY = new Date('2026-09-29T15:00:00.000Z');

describe('buildCalendarGrid', () => {
  it('ends on the week of today, Monday first, with 7 days per week', () => {
    const grid = buildCalendarGrid(TUESDAY, 4, new Map());

    expect(grid.weeks).toHaveLength(4);
    expect(grid.weeks.every((week) => week.length === 7)).toBe(true);
    expect(grid.weeks[3]?.[0]?.date).toBe('2026-09-28');
    expect(grid.weeks[0]?.[0]?.date).toBe('2026-09-07');
    expect(grid.from).toBe('2026-09-07');
    expect(grid.to).toBe('2026-09-29');
  });

  it('flags the days after today as future', () => {
    const lastWeek = buildCalendarGrid(TUESDAY, 1, new Map()).weeks[0] ?? [];

    expect(lastWeek.map((day) => day.isFuture)).toEqual([false, false, true, true, true, true, true]);
  });

  it('reports the workouts of each day', () => {
    const grid = buildCalendarGrid(TUESDAY, 2, new Map([['2026-09-22', 2]]));
    const days = grid.weeks.flat();

    expect(days.find((day) => day.date === '2026-09-22')?.workouts).toBe(2);
    expect(days.find((day) => day.date === '2026-09-23')?.workouts).toBe(0);
  });

  it('labels the first week whose Monday falls in a new month', () => {
    const grid = buildCalendarGrid(TUESDAY, 9, new Map());

    expect(grid.monthLabels).toEqual([
      { week: 0, label: 'Aug' },
      { week: 5, label: 'Sept' },
    ]);
  });

  it('labels a month that starts on a Sunday of the first week', () => {
    const grid = buildCalendarGrid(new Date('2026-03-03T12:00:00.000Z'), 6, new Map());

    expect(grid.weeks[0]?.[6]?.date).toBe('2026-02-01');
    expect(grid.monthLabels).toEqual([
      { week: 1, label: 'Feb' },
      { week: 5, label: 'Mar' },
    ]);
  });

  it('never labels a month that has not started yet', () => {
    const grid = buildCalendarGrid(TUESDAY, 2, new Map());

    expect(grid.monthLabels.map((month) => month.label)).not.toContain('Oct');
  });

  it('works when today is a Sunday', () => {
    const grid = buildCalendarGrid(new Date('2026-10-04T08:00:00.000Z'), 1, new Map());

    expect(grid.weeks[0]?.map((day) => day.date)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(grid.weeks[0]?.some((day) => day.isFuture)).toBe(false);
  });
});

describe('yearsBetween', () => {
  it('lists every year from the first to the last date', () => {
    expect(yearsBetween('2025-11-03', '2026-09-29')).toEqual([2025, 2026]);
    expect(yearsBetween('2026-01-05', '2026-09-29')).toEqual([2026]);
  });
});

describe('rollingSum', () => {
  it('sums each point with the previous ones and drops the incomplete head', () => {
    const points = [1, 2, 3, 4, 5].map((value, index) => ({ bucket: `d${index}`, value }));

    expect(rollingSum(points, 3)).toEqual([
      { bucket: 'd2', value: 6 },
      { bucket: 'd3', value: 9 },
      { bucket: 'd4', value: 12 },
    ]);
  });

  it('returns nothing when there are fewer points than the window', () => {
    expect(rollingSum([{ value: 1 }], 7)).toEqual([]);
  });
});
