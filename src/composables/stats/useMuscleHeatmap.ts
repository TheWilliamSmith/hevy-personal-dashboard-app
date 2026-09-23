import { toValue, type MaybeRefOrGetter } from 'vue';

import { apiGet } from '@/lib/api';
import type { HeatmapMetric, MuscleHeatmap, StatsRange } from '@/types/stats';

import { useStatsResource, type StatsResource } from './useStatsResource';

export function useMuscleHeatmap(
  range: MaybeRefOrGetter<StatsRange>,
  metric: MaybeRefOrGetter<HeatmapMetric>,
  includeSecondary: MaybeRefOrGetter<boolean>,
): StatsResource<MuscleHeatmap> {
  return useStatsResource(
    (signal) =>
      apiGet<MuscleHeatmap>(
        '/stats/muscle-heatmap',
        {
          from: toValue(range).from,
          to: toValue(range).to,
          metric: toValue(metric),
          includeSecondary: String(toValue(includeSecondary)),
        },
        signal,
      ),
    () => [toValue(range), toValue(metric), toValue(includeSecondary)],
  );
}
