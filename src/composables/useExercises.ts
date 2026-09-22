import { computed, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';

import { ApiError, apiGet } from '@/lib/api';
import { dataVersion } from '@/lib/data-version';
import { muscleRank } from '@/constants/muscles';
import type {
  Equipment,
  ExerciseCatalog,
  ExerciseListTotals,
  ExerciseFilters,
  ExerciseGroup,
  ExerciseKind,
  ExerciseSortBy,
  MuscleGroup,
} from '@/types/exercises';

const SEARCH_DEBOUNCE_MS = 300;

const SORTS: readonly ExerciseSortBy[] = ['name', 'sessions', 'volume', 'lastPerformed'];

function queryString(query: LocationQuery, key: string): string {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

function queryList(query: LocationQuery, key: string): string[] {
  const raw = queryString(query, key);
  return raw ? raw.split(',').filter(Boolean) : [];
}

export interface UseExercises {
  groups: Ref<ExerciseGroup[]>;
  totals: ComputedRef<ExerciseListTotals | null>;
  filters: ComputedRef<ExerciseFilters>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  hasActiveFilters: ComputedRef<boolean>;
  isEmptyCatalog: ComputedRef<boolean>;
  setSearch: (value: string) => void;
  toggleMuscle: (group: MuscleGroup) => void;
  setEquipment: (value: Equipment | '') => void;
  setKind: (value: ExerciseKind | '') => void;
  setSortBy: (value: ExerciseSortBy) => void;
  toggleHideNeverPerformed: () => void;
  clearFilters: () => void;
  refresh: () => void;
}

/**
 * The route query is the source of truth for every filter.
 *
 * Only `search`, `equipment`, `kind` and `sortBy` reach the API — its query DTO
 * takes a single enum per field. Muscle-group multi-select and "hide never
 * performed" are applied client-side over the full catalog the endpoint returns
 * anyway, which keeps the URL expressive without a second round trip.
 */
export function useExercises(): UseExercises {
  const route = useRoute();
  const router = useRouter();

  const catalog = ref<ExerciseCatalog | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let controller: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const filters = computed<ExerciseFilters>(() => {
    const sort = queryString(route.query, 'sortBy');
    return {
      search: queryString(route.query, 'q'),
      muscleGroups: queryList(route.query, 'muscles') as MuscleGroup[],
      equipment: (queryString(route.query, 'equipment') || '') as Equipment | '',
      kind: (queryString(route.query, 'kind') || '') as ExerciseKind | '',
      sortBy: (SORTS as readonly string[]).includes(sort) ? (sort as ExerciseSortBy) : 'name',
      hideNeverPerformed: queryString(route.query, 'performed') === '1',
    };
  });

  function push(next: Partial<Record<string, string | undefined>>): void {
    const query: Record<string, string> = { tab: 'exercises' };
    for (const [key, value] of Object.entries({ ...route.query, ...next })) {
      if (typeof value === 'string' && value !== '' && key !== 'tab' && key !== 'exercise') {
        query[key] = value;
      }
    }
    void router.push({ name: 'home', query });
  }

  async function fetchCatalog(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiGet<ExerciseCatalog>(
        '/exercises',
        {
          search: filters.value.search || undefined,
          equipment: filters.value.equipment || undefined,
          kind: filters.value.kind || undefined,
          sortBy: filters.value.sortBy,
        },
        signal,
      );
      if (signal.aborted) {
        return;
      }
      catalog.value = response;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      catalog.value = null;
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  /**
   * Groups arrive alphabetically; the anatomical order lives in the frontend.
   * The client-side filters are applied here so the section counts always match
   * what is actually rendered.
   */
  const groups = computed<ExerciseGroup[]>(() => {
    const selected = new Set(filters.value.muscleGroups);
    const hideUnperformed = filters.value.hideNeverPerformed;

    return (catalog.value?.groups ?? [])
      .filter((group) => selected.size === 0 || selected.has(group.muscleGroup))
      .map((group) => {
        const exercises = hideUnperformed
          ? group.exercises.filter((exercise) => exercise.sessions > 0)
          : group.exercises;

        return {
          ...group,
          exercises,
          exerciseCount: exercises.length,
          totalSets: exercises.reduce((total, exercise) => total + exercise.totalSets, 0),
        };
      })
      .filter((group) => group.exercises.length > 0)
      .sort((left, right) => muscleRank(left.muscleGroup) - muscleRank(right.muscleGroup));
  });

  const hasActiveFilters = computed(
    () =>
      filters.value.search !== '' ||
      filters.value.muscleGroups.length > 0 ||
      filters.value.equipment !== '' ||
      filters.value.kind !== '' ||
      filters.value.hideNeverPerformed,
  );

  /** True only when the account has no exercises at all, filters aside. */
  const isEmptyCatalog = computed(
    () => catalog.value !== null && catalog.value.totals.exercises === 0,
  );

  watch(
    [() => filters.value.search, () => filters.value.equipment, () => filters.value.kind, () => filters.value.sortBy, dataVersion],
    () => void fetchCatalog(),
    { immediate: true },
  );

  onScopeDispose(() => {
    controller?.abort();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  return {
    groups,
    totals: computed(() => catalog.value?.totals ?? null),
    filters,
    isLoading,
    error,
    hasActiveFilters,
    isEmptyCatalog,
    setSearch: (value) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => push({ q: value || undefined }), SEARCH_DEBOUNCE_MS);
    },
    toggleMuscle: (group) => {
      const current = new Set(filters.value.muscleGroups);
      if (current.has(group)) {
        current.delete(group);
      } else {
        current.add(group);
      }
      const next = [...current];
      push({ muscles: next.length > 0 ? next.join(',') : undefined });
    },
    setEquipment: (value) => push({ equipment: value || undefined }),
    setKind: (value) => push({ kind: value || undefined }),
    setSortBy: (value) => push({ sortBy: value === 'name' ? undefined : value }),
    toggleHideNeverPerformed: () =>
      push({ performed: filters.value.hideNeverPerformed ? undefined : '1' }),
    clearFilters: () => void router.push({ name: 'home', query: { tab: 'exercises' } }),
    refresh: () => void fetchCatalog(),
  };
}
