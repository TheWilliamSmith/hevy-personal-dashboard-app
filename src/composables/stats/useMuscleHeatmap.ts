import { toValue, type MaybeRefOrGetter } from 'vue';

import { apiGet } from '@/lib/api';
import type { HeatmapMetric, MuscleHeatmap, StatsRange } from '@/types/stats';

import { useStatsResource, type StatsResource } from './useStatsResource';

/**
 * Muscle balance for the dashboard's current window.
 *
 * Built on useStatsResource, so it inherits the abort-on-change behaviour every
 * other stats card uses: a newer request cancels the one in flight and an
 * aborted response never lands, which is what keeps a fast sequence of filter
 * clicks from painting stale numbers.
 */
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
          // ParseQueryBoolean on the API reads "true"/"false" strings.
          includeSecondary: String(toValue(includeSecondary)),
        },
        signal,
      ),
    () => [toValue(range), toValue(metric), toValue(includeSecondary)],
  );
}
