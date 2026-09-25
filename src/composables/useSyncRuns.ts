import { onScopeDispose, ref, type Ref } from 'vue';

import { ApiError, apiGet } from '@/lib/api';
import type { HevySyncRun } from '@/types/hevy';
import type { Paginated, PaginationMeta } from '@/types/workouts';

export const RUNS_PER_PAGE = 20;

export interface UseSyncRuns {
  runs: Ref<HevySyncRun[]>;
  meta: Ref<PaginationMeta | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  expandedId: Ref<string | null>;
  refresh: () => void;
  goToPage: (page: number) => void;
  toggleRow: (id: string) => void;
}

export function useSyncRuns(): UseSyncRuns {
  const runs = ref<HevySyncRun[]>([]);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const expandedId = ref<string | null>(null);
  const page = ref(1);

  let controller: AbortController | null = null;

  async function fetchList(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiGet<Paginated<HevySyncRun>>(
        '/hevy/sync/runs',
        { page: page.value, limit: RUNS_PER_PAGE },
        signal,
      );
      if (signal.aborted) {
        return;
      }
      runs.value = response.data;
      meta.value = response.meta;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      runs.value = [];
      meta.value = null;
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  function toggleRow(id: string): void {
    expandedId.value = expandedId.value === id ? null : id;
  }

  function goToPage(next: number): void {
    const last = meta.value?.totalPages ?? 1;
    if (next < 1 || next > last || next === page.value) {
      return;
    }
    page.value = next;
    void fetchList();
  }

  void fetchList();

  onScopeDispose(() => controller?.abort());

  return {
    runs,
    meta,
    isLoading,
    error,
    expandedId,
    refresh: () => void fetchList(),
    goToPage,
    toggleRow,
  };
}
