import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

import { ApiError, apiGet, apiPatch, apiPost } from '@/lib/api';
import { invalidateWorkoutData } from '@/lib/data-version';
import type {
  ExerciseDetail,
  MergeExerciseResult,
  UpdateExercisePayload,
} from '@/types/exercises';

export const HISTORY_PAGE_SIZE = 10;

export interface UseExercise {
  detail: Ref<ExerciseDetail | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  notFound: Ref<boolean>;
  historyPage: Ref<number>;
  isLoadingMore: Ref<boolean>;
  hasMoreHistory: Ref<boolean>;
  isSaving: Ref<boolean>;
  mutationError: Ref<string | null>;
  refresh: () => void;
  loadMoreHistory: () => Promise<void>;
  updateClassification: (payload: UpdateExercisePayload) => Promise<boolean>;
  mergeInto: (sourceExerciseId: string) => Promise<MergeExerciseResult | null>;
}

/**
 * GET /exercises/:slug returns summary, records, progression and history in one
 * response, so there is nothing to parallelise — a single request already
 * carries every section.
 *
 * History paginates on that same endpoint, so "load more" refetches the whole
 * detail. Pages are appended locally rather than replacing the list.
 */
export function useExercise(slug: MaybeRefOrGetter<string>): UseExercise {
  const detail = ref<ExerciseDetail | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const notFound = ref(false);

  const historyPage = ref(1);
  const isLoadingMore = ref(false);
  const hasMoreHistory = ref(false);

  const isSaving = ref(false);
  const mutationError = ref<string | null>(null);

  let controller: AbortController | null = null;

  async function fetchDetail(page = 1, append = false): Promise<void> {
    const current = toValue(slug);
    if (!current) {
      return;
    }

    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    if (append) {
      isLoadingMore.value = true;
    } else {
      isLoading.value = true;
      notFound.value = false;
    }
    error.value = null;

    try {
      const response = await apiGet<ExerciseDetail>(
        `/exercises/${encodeURIComponent(current)}`,
        { page, limit: HISTORY_PAGE_SIZE },
        signal,
      );
      if (signal.aborted) {
        return;
      }

      if (append && detail.value) {
        detail.value = {
          ...response,
          history: {
            ...response.history,
            data: [...detail.value.history.data, ...response.history.data],
          },
        };
      } else {
        detail.value = response;
      }

      historyPage.value = response.history.meta.page;
      hasMoreHistory.value = response.history.meta.page < response.history.meta.totalPages;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      if (!append) {
        detail.value = null;
        notFound.value = caught instanceof ApiError && caught.status === 404;
      }
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    }
  }

  async function loadMoreHistory(): Promise<void> {
    if (!hasMoreHistory.value || isLoadingMore.value) {
      return;
    }
    await fetchDetail(historyPage.value + 1, true);
  }

  /** PATCH takes the exercise id, not the slug. */
  async function updateClassification(payload: UpdateExercisePayload): Promise<boolean> {
    const id = detail.value?.exercise.id;
    if (!id) {
      return false;
    }

    isSaving.value = true;
    mutationError.value = null;

    try {
      await apiPatch(`/exercises/${encodeURIComponent(id)}`, payload);
      // A reclassification moves the exercise between muscle groups, which the
      // dashboard's breakdown and the catalog both depend on.
      invalidateWorkoutData();
      await fetchDetail(1);
      return true;
    } catch (caught) {
      mutationError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  /** Merges `sourceExerciseId` INTO this exercise, then deletes the source. */
  async function mergeInto(sourceExerciseId: string): Promise<MergeExerciseResult | null> {
    const id = detail.value?.exercise.id;
    if (!id) {
      return null;
    }

    isSaving.value = true;
    mutationError.value = null;

    try {
      const merged = await apiPost<MergeExerciseResult>(
        `/exercises/${encodeURIComponent(id)}/merge`,
        { sourceExerciseId },
      );
      invalidateWorkoutData();
      await fetchDetail(1);
      return merged;
    } catch (caught) {
      mutationError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
      return null;
    } finally {
      isSaving.value = false;
    }
  }

  watch(() => toValue(slug), () => void fetchDetail(1), { immediate: true });

  onScopeDispose(() => controller?.abort());

  return {
    detail,
    isLoading,
    error,
    notFound,
    historyPage,
    isLoadingMore,
    hasMoreHistory,
    isSaving,
    mutationError,
    refresh: () => void fetchDetail(1),
    loadMoreHistory,
    updateClassification,
    mergeInto,
  };
}
