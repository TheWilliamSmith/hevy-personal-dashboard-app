import { onScopeDispose, ref, watch, type Ref } from 'vue';

import { ApiError } from '@/lib/api';
import { dataVersion } from '@/lib/data-version';

export interface StatsResource<T> {
  data: Ref<T | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  /** Refetches this resource alone — the per-card retry. */
  refresh: () => void;
}

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

/**
 * One request in flight per resource. A newer call aborts the older one, and an
 * aborted call returns without touching state, so a fast sequence of filter
 * changes can never let a stale response win.
 *
 * Each card owns its own resource, so cards resolve independently and the
 * dashboard paints progressively instead of waiting for the slowest endpoint.
 */
export function useStatsResource<T>(
  fetcher: Fetcher<T>,
  /** Reactive inputs; any change refetches. */
  deps: () => unknown,
): StatsResource<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let controller: AbortController | null = null;

  async function run(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    isLoading.value = true;
    error.value = null;

    try {
      const result = await fetcher(signal);
      if (signal.aborted) {
        return;
      }
      data.value = result;
    } catch (caught) {
      if (signal.aborted || (caught instanceof DOMException && caught.name === 'AbortError')) {
        return;
      }
      data.value = null;
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  // `immediate` is what makes every resource fire during setup: they are all
  // started in the same tick and resolve concurrently, never waterfalled.
  // dataVersion is folded into every resource's deps: a rollback invalidates
  // every stat at once, and apiGet then bypasses the HTTP cache.
  watch([deps, dataVersion], () => void run(), { immediate: true, deep: true });

  onScopeDispose(() => controller?.abort());

  return { data, isLoading, error, refresh: () => void run() };
}
