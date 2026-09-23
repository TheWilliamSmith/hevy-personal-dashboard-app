import { useStatsResource, type StatsResource } from '@/composables/stats/useStatsResource';
import { apiGet } from '@/lib/api';
import type { ProgressSummary } from '@/types/progress';

/**
 * Dashboard "Needs attention" card. The server classifies; this only reads,
 * so the Dashboard never re-derives a status on its own.
 */
export function useProgressSummary(): StatsResource<ProgressSummary> {
  return useStatsResource(
    (signal) => apiGet<ProgressSummary>('/progress/summary', {}, signal),
    () => null,
  );
}
