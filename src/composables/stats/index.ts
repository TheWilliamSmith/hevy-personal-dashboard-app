import { toValue, type MaybeRefOrGetter } from 'vue';

import { apiGet, type QueryParams } from '@/lib/api';
import type {
  CalendarDay,
  DistributionBucket,
  DistributionDimension,
  Granularity,
  Overview,
  StatsRange,
  TimeseriesMetric,
  TimeseriesPoint,
} from '@/types/stats';

import { useStatsResource, type StatsResource } from './useStatsResource';

function rangeParams(range: StatsRange): QueryParams {
  return { from: range.from, to: range.to };
}

export function useStatsOverview(range: MaybeRefOrGetter<StatsRange>): StatsResource<Overview> {
  return useStatsResource(
    (signal) => apiGet<Overview>('/stats/overview', rangeParams(toValue(range)), signal),
    () => toValue(range),
  );
}

export function useStatsTimeseries(
  range: MaybeRefOrGetter<StatsRange>,
  metric: MaybeRefOrGetter<TimeseriesMetric>,
  granularity: MaybeRefOrGetter<Granularity>,
): StatsResource<TimeseriesPoint[]> {
  return useStatsResource(
    (signal) =>
      apiGet<TimeseriesPoint[]>(
        '/stats/timeseries',
        {
          ...rangeParams(toValue(range)),
          metric: toValue(metric),
          granularity: toValue(granularity),
        },
        signal,
      ),
    () => [toValue(range), toValue(metric), toValue(granularity)],
  );
}

export function useStatsDistribution(
  range: MaybeRefOrGetter<StatsRange>,
  dimension: MaybeRefOrGetter<DistributionDimension>,
): StatsResource<DistributionBucket[]> {
  return useStatsResource(
    (signal) =>
      apiGet<DistributionBucket[]>(
        '/stats/distribution',
        { ...rangeParams(toValue(range)), dimension: toValue(dimension) },
        signal,
      ),
    () => [toValue(range), toValue(dimension)],
  );
}

export function useStatsCalendar(year: MaybeRefOrGetter<number>): StatsResource<CalendarDay[]> {
  return useStatsResource(
    (signal) => apiGet<CalendarDay[]>('/stats/calendar', { year: toValue(year) }, signal),
    () => toValue(year),
  );
}

export { useMuscleHeatmap } from './useMuscleHeatmap';
export { useDashboardFilters } from './useDashboardFilters';
export type { StatsResource } from './useStatsResource';
