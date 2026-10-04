import { describe, expect, it } from 'vitest';

import { buildCalendarGrid, rollingSum, startOfWeek, yearsBetween } from '@/utils/calendar';

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
    expect(grid.monthLabels).toEqual([{ week: 1, label: 'Feb' }]);
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

describe('startOfWeek', () => {
  it.each([
    ['2026-09-27T23:00:00.000Z', '2026-09-21', '2026-09-27'],
    ['2026-09-28T00:00:00.000Z', '2026-09-28', '2026-09-27'],
    ['2026-10-03T23:59:59.000Z', '2026-09-28', '2026-09-27'],
    ['2026-10-04T08:00:00.000Z', '2026-09-28', '2026-10-04'],
    ['2027-01-01T08:00:00.000Z', '2026-12-28', '2026-12-27'],
  ])('%s starts on %s (Monday) or %s (Sunday)', (iso, monday, sunday) => {
    expect(startOfWeek(new Date(iso)).toISOString().slice(0, 10)).toBe(monday);
    expect(startOfWeek(new Date(iso), 'sunday').toISOString().slice(0, 10)).toBe(sunday);
  });
});

describe('buildCalendarGrid with a Sunday week start', () => {
  it('starts each column on Sunday', () => {
    const grid = buildCalendarGrid(TUESDAY, 2, new Map([['2026-09-27', 1]]), 'sunday');

    expect(grid.weeks[1]?.[0]?.date).toBe('2026-09-27');
    expect(grid.weeks[1]?.[0]?.workouts).toBe(1);
    expect(grid.weeks[0]?.[0]?.date).toBe('2026-09-20');
    expect(grid.weeks[1]?.map((day) => day.isFuture)).toEqual([false, false, false, true, true, true, true]);
  });

  it('leaves out a month label that has no room in the last columns', () => {
    const grid = buildCalendarGrid(new Date('2026-10-04T08:00:00.000Z'), 12, new Map(), 'sunday');

    expect(grid.weeks[11]?.[0]?.date).toBe('2026-10-04');
    expect(grid.monthLabels.map((month) => month.label)).not.toContain('Oct');
    expect(grid.monthLabels.every((month) => month.week + 3 <= 12)).toBe(true);
  });

  it('puts Sunday at the end of the week by default', () => {
    const grid = buildCalendarGrid(TUESDAY, 2, new Map());
    expect(grid.weeks[0]?.[6]?.date).toBe('2026-09-27');
  });
});
