import { onScopeDispose, ref, watch, type Ref } from 'vue';

import { ApiError } from '@/lib/api';
import { dataVersion } from '@/lib/data-version';

export interface StatsResource<T> {
  data: Ref<T | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  refresh: () => void;
}

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

export function useStatsResource<T>(
  fetcher: Fetcher<T>,
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

  watch([deps, dataVersion], () => void run(), { immediate: true, deep: true });

  onScopeDispose(() => controller?.abort());

  return { data, isLoading, error, refresh: () => void run() };
}
