import type { WeekStart } from '@/types/profile';

import { dateFormat } from './format';

export interface CalendarCell {
  date: string;
  workouts: number;
  isFuture: boolean;
}

export interface CalendarGrid {
  weeks: CalendarCell[][];
  monthLabels: Array<{ week: number; label: string }>;
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABEL_WEEKS = 3;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function startOfWeek(date: Date, weekStart: WeekStart = 'monday'): Date {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const offset = weekStart === 'sunday' ? weekday : (weekday + 6) % 7;
  return new Date(day.getTime() - offset * DAY_MS);
}

export function buildCalendarGrid(
  today: Date,
  weekCount: number,
  workoutsByDate: ReadonlyMap<string, number>,
  weekStart: WeekStart = 'monday',
): CalendarGrid {
  const end = startOfUtcDay(today);
  const firstDay = new Date(startOfWeek(end, weekStart).getTime() - (weekCount - 1) * 7 * DAY_MS);

  const weeks: CalendarCell[][] = [];
  const monthLabels: CalendarGrid['monthLabels'] = [];

  for (let week = 0; week < weekCount; week += 1) {
    const days: CalendarCell[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(firstDay.getTime() + (week * 7 + weekday) * DAY_MS);
      const key = isoDay(date);
      days.push({
        date: key,
        workouts: workoutsByDate.get(key) ?? 0,
        isFuture: date.getTime() > end.getTime(),
      });
    }
    weeks.push(days);

    const monday = new Date(firstDay.getTime() + week * 7 * DAY_MS);
    const previousMonday = new Date(monday.getTime() - 7 * DAY_MS);
    if (week > 0 && monday.getUTCMonth() !== previousMonday.getUTCMonth()) {
      monthLabels.push({ week, label: dateFormat({ month: 'short', timeZone: 'UTC' }).format(monday) });
    }
  }

  if ((monthLabels[0]?.week ?? weekCount) >= 3) {
    monthLabels.unshift({ week: 0, label: dateFormat({ month: 'short', timeZone: 'UTC' }).format(firstDay) });
  }

  const fitting = monthLabels.filter((month) => month.week + MONTH_LABEL_WEEKS <= weekCount);
  return { weeks, monthLabels: fitting, from: isoDay(firstDay), to: isoDay(end) };
}

export function yearsBetween(from: string, to: string): number[] {
  const start = Number(from.slice(0, 4));
  const end = Number(to.slice(0, 4));
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function rollingSum<T extends { value: number }>(points: readonly T[], window: number): T[] {
  return points.slice(window - 1).map((point, index) => ({
    ...point,
    value: points.slice(index, index + window).reduce((total, current) => total + current.value, 0),
  }));
}
