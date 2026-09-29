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

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Builds a GitHub-style grid: one column per week, Monday first, the last
 * column being the week of `today`. Days after `today` are flagged isFuture.
 */
export function buildCalendarGrid(
  today: Date,
  weekCount: number,
  workoutsByDate: ReadonlyMap<string, number>,
): CalendarGrid {
  const end = startOfUtcDay(today);
  const mondayOffset = (end.getUTCDay() + 6) % 7;
  const firstMonday = new Date(end.getTime() - (mondayOffset + (weekCount - 1) * 7) * DAY_MS);

  const weeks: CalendarCell[][] = [];
  const monthLabels: CalendarGrid['monthLabels'] = [];

  for (let week = 0; week < weekCount; week += 1) {
    const days: CalendarCell[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(firstMonday.getTime() + (week * 7 + weekday) * DAY_MS);
      const key = isoDay(date);
      days.push({
        date: key,
        workouts: workoutsByDate.get(key) ?? 0,
        isFuture: date.getTime() > end.getTime(),
      });
    }
    weeks.push(days);

    const monday = new Date(firstMonday.getTime() + week * 7 * DAY_MS);
    const previousMonday = new Date(monday.getTime() - 7 * DAY_MS);
    if (week > 0 && monday.getUTCMonth() !== previousMonday.getUTCMonth()) {
      monthLabels.push({ week, label: MONTH_FORMATTER.format(monday) });
    }
  }

  if ((monthLabels[0]?.week ?? weekCount) >= 3) {
    monthLabels.unshift({ week: 0, label: MONTH_FORMATTER.format(firstMonday) });
  }

  return { weeks, monthLabels, from: isoDay(firstMonday), to: isoDay(end) };
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
