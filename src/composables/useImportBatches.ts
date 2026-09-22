import { onScopeDispose, ref, type Ref } from 'vue';

import { ApiError, apiDelete, apiGet } from '@/lib/api';
import { invalidateWorkoutData } from '@/lib/data-version';
import type {
  ImportBatchDetail,
  ImportBatchSummary,
  RollbackResult,
} from '@/types/imports';
import type { Paginated, PaginationMeta } from '@/types/workouts';

export const BATCHES_PER_PAGE = 20;

export interface UseImportBatches {
  batches: Ref<ImportBatchSummary[]>;
  meta: Ref<PaginationMeta | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  /** Id of the row currently expanded, or null. */
  expandedId: Ref<string | null>;
  detail: Ref<ImportBatchDetail | null>;
  isDetailLoading: Ref<boolean>;
  detailError: Ref<string | null>;
  deletingId: Ref<string | null>;
  deleteError: Ref<string | null>;
  refresh: () => void;
  goToPage: (page: number) => void;
  toggleRow: (id: string) => void;
  rollback: (id: string, deleteWorkouts: boolean) => Promise<RollbackResult | null>;
}

/**
 * Owns the import history: list, pagination, row detail and rollback. The view
 * stays presentational.
 */
export function useImportBatches(): UseImportBatches {
  const batches = ref<ImportBatchSummary[]>([]);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const expandedId = ref<string | null>(null);
  const detail = ref<ImportBatchDetail | null>(null);
  const isDetailLoading = ref(false);
  const detailError = ref<string | null>(null);

  const deletingId = ref<string | null>(null);
  const deleteError = ref<string | null>(null);

  const page = ref(1);

  let listController: AbortController | null = null;
  let detailController: AbortController | null = null;

  async function fetchList(): Promise<void> {
    listController?.abort();
    listController = new AbortController();
    const { signal } = listController;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiGet<Paginated<ImportBatchSummary>>(
        '/imports',
        { page: page.value, limit: BATCHES_PER_PAGE },
        signal,
      );
      if (signal.aborted) {
        return;
      }
      batches.value = response.data;
      meta.value = response.meta;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      batches.value = [];
      meta.value = null;
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  async function fetchDetail(id: string): Promise<void> {
    detailController?.abort();
    detailController = new AbortController();
    const { signal } = detailController;

    isDetailLoading.value = true;
    detailError.value = null;
    detail.value = null;

    try {
      const response = await apiGet<ImportBatchDetail>(`/imports/${encodeURIComponent(id)}`, {}, signal);
      if (signal.aborted) {
        return;
      }
      detail.value = response;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      detailError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isDetailLoading.value = false;
      }
    }
  }

  function toggleRow(id: string): void {
    if (expandedId.value === id) {
      expandedId.value = null;
      detail.value = null;
      detailController?.abort();
      return;
    }

    expandedId.value = id;
    void fetchDetail(id);
  }

  /**
   * Resolves with the result, or null when it failed — `deleteError` carries
   * the reason. The API's 409 message explains exactly why a batch cannot be
   * attributed, so it is surfaced verbatim rather than replaced.
   */
  async function rollback(id: string, deleteWorkouts: boolean): Promise<RollbackResult | null> {
    deletingId.value = id;
    deleteError.value = null;

    try {
      const rolled = await apiDelete<RollbackResult>(`/imports/${encodeURIComponent(id)}`, {
        deleteWorkouts: String(deleteWorkouts),
      });

      // Workouts and stats elsewhere in the app now describe deleted rows.
      if (rolled.workoutsDeleted > 0) {
        invalidateWorkoutData();
      }

      if (expandedId.value === id) {
        expandedId.value = null;
        detail.value = null;
      }

      // A page that just lost its last row would otherwise render empty.
      if (batches.value.length === 1 && page.value > 1) {
        page.value -= 1;
      }
      await fetchList();

      return rolled;
    } catch (caught) {
      deleteError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
      return null;
    } finally {
      deletingId.value = null;
    }
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

  onScopeDispose(() => {
    listController?.abort();
    detailController?.abort();
  });

  return {
    batches,
    meta,
    isLoading,
    error,
    expandedId,
    detail,
    isDetailLoading,
    detailError,
    deletingId,
    deleteError,
    refresh: () => void fetchList(),
    goToPage,
    toggleRow,
    rollback,
  };
}
