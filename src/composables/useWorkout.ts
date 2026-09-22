import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

import { ApiError, apiGet } from '@/lib/api';
import type { WorkoutDetail } from '@/types/workouts';

export interface UseWorkout {
  workout: Ref<WorkoutDetail | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  notFound: Ref<boolean>;
  retry: () => void;
}

/** Refetches whenever the id changes, so the route param can drive it directly. */
export function useWorkout(id: MaybeRefOrGetter<string>): UseWorkout {
  const workout = ref<WorkoutDetail | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const notFound = ref(false);

  let controller: AbortController | null = null;

  async function fetchWorkout(): Promise<void> {
    const workoutId = toValue(id);
    if (!workoutId) {
      return;
    }

    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;

    isLoading.value = true;
    error.value = null;
    notFound.value = false;

    try {
      workout.value = await apiGet<WorkoutDetail>(
        `/workouts/${encodeURIComponent(workoutId)}`,
        {},
        signal,
      );
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      workout.value = null;
      // ParseUUIDPipe answers 400 for a malformed id; to the reader that is
      // the same thing as a workout that does not exist.
      notFound.value =
        caught instanceof ApiError && (caught.status === 404 || caught.status === 400);
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  watch(() => toValue(id), fetchWorkout, { immediate: true });

  onScopeDispose(() => controller?.abort());

  return { workout, isLoading, error, notFound, retry: () => void fetchWorkout() };
}
