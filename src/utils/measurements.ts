import type { Measurement, MeasurementField } from '@/types/measurements';

const DAY_MS = 24 * 60 * 60 * 1000;

export const MEASUREMENT_FIELDS: readonly MeasurementField[] = ['weightKg', 'armCm', 'waistCm', 'thighCm', 'chestCm'];

export function withValue(entries: readonly Measurement[], field: MeasurementField): Measurement[] {
  return entries.filter((entry) => entry[field] !== null).sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
}

export function bodyweightOn(date: string, entries: readonly Measurement[], fallback: number | null): number | null {
  const weighed = withValue(entries, 'weightKg');
  const day = date.slice(0, 10);
  const before = weighed.filter((entry) => entry.measuredOn <= day).at(-1);
  return before?.weightKg ?? weighed[0]?.weightKg ?? fallback;
}

export function relativeStrength(oneRepMax: number | null | undefined, bodyweight: number | null): number | null {
  if (!oneRepMax || !bodyweight) {
    return null;
  }
  return Math.round((oneRepMax / bodyweight) * 100) / 100;
}

export interface FieldSummary {
  latest: Measurement | null;
  change: number | null;
  since: string | null;
}

export function summarize(entries: readonly Measurement[], field: MeasurementField, days = 30): FieldSummary {
  const points = withValue(entries, field);
  const latest = points.at(-1) ?? null;
  if (!latest || points.length < 2) {
    return { latest, change: null, since: null };
  }
  const target = Date.parse(latest.measuredOn) - days * DAY_MS;
  const earlier = points.slice(0, -1);
  const reference = earlier.reduce((best, entry) =>
    Math.abs(Date.parse(entry.measuredOn) - target) < Math.abs(Date.parse(best.measuredOn) - target) ? entry : best,
  );
  const change = Math.round(((latest[field] ?? 0) - (reference[field] ?? 0)) * 10) / 10;
  return { latest, change, since: reference.measuredOn };
}
