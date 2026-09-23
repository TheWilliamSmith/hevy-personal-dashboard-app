import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';

import { ApiError, apiGet } from '@/lib/api';
import { dataVersion } from '@/lib/data-version';
import type {
  ExerciseOption,
  Paginated,
  PaginationMeta,
  WorkoutFilters,
  WorkoutSummary,
} from '@/types/workouts';

export const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_FILTERS: WorkoutFilters = { search: '', exercise: '', from: '', to: '' };

function queryString(query: LocationQuery, key: string): string {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

function queryPage(query: LocationQuery): number {
  const page = Number.parseInt(queryString(query, 'page'), 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

function startOfDay(date: string): string | undefined {
  return date ? `${date}T00:00:00.000Z` : undefined;
}

function endOfDay(date: string): string | undefined {
  return date ? `${date}T23:59:59.999Z` : undefined;
}

export interface UseWorkouts {
  workouts: Ref<WorkoutSummary[]>;
  meta: Ref<PaginationMeta | null>;
  filters: Ref<WorkoutFilters>;
  page: Ref<number>;
  exercises: Ref<ExerciseOption[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  setSearch: (value: string) => void;
  setExercise: (value: string) => void;
  setDateRange: (from: string, to: string) => void;
  clearFilters: () => void;
  goToPage: (page: number) => void;
  retry: () => void;
}

export function useWorkouts(): UseWorkouts {
  const route = useRoute();
  const router = useRouter();

  const workouts = ref<WorkoutSummary[]>([]);
  const meta = ref<PaginationMeta | null>(null);
  const exercises = ref<ExerciseOption[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const filters = ref<WorkoutFilters>({ ...EMPTY_FILTERS });
  const page = ref(1);

  let controller: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function syncFromRoute(): void {
    filters.value = {
      search: queryString(route.query, 'search'),
      exercise: queryString(route.query, 'exercise'),
      from: queryString(route.query, 'from'),
      to: queryString(route.query, 'to'),
    };
    page.value = queryPage(route.query);
  }

  syncFromRoute();

  function pushQuery(next: Partial<WorkoutFilters> & { page?: number }): void {
    const merged = { ...filters.value, ...next };
    const nextPage = next.page ?? 1;

    const query: Record<string, string> = { tab: 'workouts' };
    if (merged.search) query.search = merged.search;
    if (merged.exercise) query.exercise = merged.exercise;
    if (merged.from) query.from = merged.from;
    if (merged.to) query.to = merged.to;
    if (nextPage > 1) query.page = String(nextPage);

    void router.push({ name: 'home', query });
  }

  async function fetchWorkouts(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;

    isLoading.value = true;
    error.value = null;

    try {
      const result = await apiGet<Paginated<WorkoutSummary>>(
        '/workouts',
        {
          page: page.value,
          limit: DEFAULT_LIMIT,
          search: filters.value.search || undefined,
          exercise: filters.value.exercise || undefined,
          from: startOfDay(filters.value.from),
          to: endOfDay(filters.value.to),
        },
        signal,
      );

      workouts.value = result.data;
      meta.value = result.meta;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      workouts.value = [];
      meta.value = null;
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  async function fetchExercises(): Promise<void> {
    try {
      exercises.value = await apiGet<ExerciseOption[]>('/workouts/exercises');
    } catch {
      exercises.value = [];
    }
  }

  watch(dataVersion, () => void fetchWorkouts());

  watch(
    () => route.query,
    () => {
      if (route.query.tab !== 'workouts' || route.query.workout) {
        return;
      }
      syncFromRoute();
      void fetchWorkouts();
    },
    { deep: true },
  );

  void fetchWorkouts();
  void fetchExercises();

  function setSearch(value: string): void {
    filters.value.search = value;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => pushQuery({ search: value }), SEARCH_DEBOUNCE_MS);
  }

  function setExercise(value: string): void {
    pushQuery({ exercise: value });
  }

  function setDateRange(from: string, to: string): void {
    pushQuery({ from, to });
  }

  function clearFilters(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    void router.push({ name: 'home', query: { tab: 'workouts' } });
  }

  function goToPage(next: number): void {
    const last = meta.value?.totalPages ?? 1;
    if (next < 1 || next > last || next === page.value) {
      return;
    }
    pushQuery({ page: next });
  }

  onScopeDispose(() => {
    controller?.abort();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  return {
    workouts,
    meta,
    filters,
    page,
    exercises,
    isLoading,
    error,
    setSearch,
    setExercise,
    setDateRange,
    clearFilters,
    goToPage,
    retry: () => void fetchWorkouts(),
  };
}

export const hasActiveFilters = (filters: WorkoutFilters): boolean =>
  Boolean(filters.search || filters.exercise || filters.from || filters.to);

export const useHasActiveFilters = (filters: Ref<WorkoutFilters>) =>
  computed(() => hasActiveFilters(filters.value));
