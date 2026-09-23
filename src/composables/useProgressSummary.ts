import { useStatsResource, type StatsResource } from '@/composables/stats/useStatsResource';
import { apiGet } from '@/lib/api';
import type { ProgressSummary } from '@/types/progress';

export function useProgressSummary(): StatsResource<ProgressSummary> {
  return useStatsResource(
    (signal) => apiGet<ProgressSummary>('/progress/summary', {}, signal),
    () => null,
  );
}
