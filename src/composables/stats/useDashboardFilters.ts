import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';

import type { Granularity, StatsRange } from '@/types/stats';

export type RangePreset = '30d' | '3m' | '6m' | '1y' | 'all' | 'custom';

export const RANGE_PRESETS: ReadonlyArray<{ value: RangePreset; label: string; days: number | null }> =
  [
    { value: '30d', label: '30 days', days: 30 },
    { value: '3m', label: '3 months', days: 90 },
    { value: '6m', label: '6 months', days: 180 },
    { value: '1y', label: '1 year', days: 365 },
    { value: 'all', label: 'All', days: null },
  ];

export const GRANULARITIES: ReadonlyArray<{ value: Granularity; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function queryString(query: LocationQuery, key: string): string {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

function isPreset(value: string): value is RangePreset {
  return value === 'custom' || RANGE_PRESETS.some((preset) => preset.value === value);
}

function isGranularity(value: string): value is Granularity {
  return value === 'day' || value === 'week' || value === 'month';
}

/** Start of the UTC day, n days back. The API filters on UTC instants. */
function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

export interface UseDashboardFilters {
  preset: ComputedRef<RangePreset>;
  granularity: ComputedRef<Granularity>;
  customFrom: ComputedRef<string>;
  customTo: ComputedRef<string>;
  year: ComputedRef<number>;
  /** Derived client-side: the API sends `previous` without a label. */
  comparisonLabel: ComputedRef<string>;
  /** What the /stats endpoints receive. Empty object for the "all" preset. */
  range: ComputedRef<StatsRange>;
  setPreset: (preset: RangePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  setGranularity: (granularity: Granularity) => void;
  setYear: (year: number) => void;
}

/**
 * Owns from/to/granularity and keeps them in the URL, so a refresh or a shared
 * link restores the same dashboard. The query is the only source of truth.
 */
export function useDashboardFilters(): UseDashboardFilters {
  const route = useRoute();
  const router = useRouter();

  const preset = computed<RangePreset>(() => {
    const value = queryString(route.query, 'range');
    return isPreset(value) ? value : '30d';
  });

  const granularity = computed<Granularity>(() => {
    const value = queryString(route.query, 'granularity');
    if (isGranularity(value)) {
      return value;
    }
    // A year of daily bars is unreadable; default to a sensible bucket size.
    return preset.value === '1y' || preset.value === 'all' ? 'month' : 'day';
  });

  const customFrom = computed(() => queryString(route.query, 'from'));
  const customTo = computed(() => queryString(route.query, 'to'));

  const year = computed<number>(() => {
    const parsed = Number.parseInt(queryString(route.query, 'year'), 10);
    return Number.isFinite(parsed) ? parsed : new Date().getUTCFullYear();
  });

  const comparisonLabel = computed(() => {
    const found = RANGE_PRESETS.find((candidate) => candidate.value === preset.value);
    return found?.days ? `vs previous ${found.days} days` : 'vs previous period';
  });

  const range = computed<StatsRange>(() => {
    if (preset.value === 'custom') {
      const result: StatsRange = {};
      // Widen `to` to the end of the day, otherwise a bare date resolves to
      // midnight and drops everything logged later that day.
      if (customFrom.value) result.from = `${customFrom.value}T00:00:00.000Z`;
      if (customTo.value) result.to = `${customTo.value}T23:59:59.999Z`;
      return result;
    }

    const found = RANGE_PRESETS.find((candidate) => candidate.value === preset.value);
    return found?.days ? { from: daysAgo(found.days) } : {};
  });

  function push(next: Record<string, string | undefined>): void {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...route.query, ...next })) {
      if (typeof value === 'string' && value !== '' && key !== 'tab') {
        query[key] = value;
      }
    }

    // These filters are shared by the Dashboard and the Body tab, so the
    // current tab has to survive a range change. Dashboard is the default and
    // needs no parameter; any other tab must be written back explicitly.
    const currentTab = route.query.tab;
    if (typeof currentTab === 'string' && currentTab !== '' && currentTab !== 'dashboard') {
      query.tab = currentTab;
    }

    void router.push({ name: 'home', query });
  }

  return {
    preset,
    granularity,
    customFrom,
    customTo,
    year,
    comparisonLabel,
    range,
    setPreset: (value) =>
      push({
        range: value === '30d' ? undefined : value,
        from: value === 'custom' ? customFrom.value : undefined,
        to: value === 'custom' ? customTo.value : undefined,
      }),
    setCustomRange: (from, to) => push({ range: 'custom', from, to }),
    setGranularity: (value) => push({ granularity: value }),
    setYear: (value) => push({ year: String(value) }),
  };
}
