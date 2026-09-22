import { readonly, ref } from 'vue';

const version = ref(0);

/**
 * Bumped whenever a write invalidates read models elsewhere in the app — today
 * only an import rollback does that.
 *
 * Two things depend on it:
 *   1. composables include it in their watch deps, so a bump refetches;
 *   2. the refetch bypasses the HTTP cache, because /stats/overview and
 *      /stats/calendar answer with `Cache-Control: private, max-age=60` and the
 *      browser would otherwise serve numbers that still count deleted workouts.
 */
export const dataVersion = readonly(version);

export function invalidateWorkoutData(): void {
  version.value += 1;
}

/** True once something has been invalidated, so reads must skip the HTTP cache. */
export function shouldBypassHttpCache(): boolean {
  return version.value > 0;
}
