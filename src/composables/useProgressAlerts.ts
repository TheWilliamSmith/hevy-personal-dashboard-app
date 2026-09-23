import { computed, onScopeDispose, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';

import { ApiError, apiGet, apiPatch } from '@/lib/api';
import { dataVersion } from '@/lib/data-version';
import {
  PROGRESS_DEFAULTS,
  SESSIONS_RANGE,
  STALE_RANGE,
  STATUS_ORDER,
  THRESHOLD_RANGE,
  WINDOWS,
} from '@/constants/progress';
import { MUSCLE_ORDER } from '@/constants/muscles';
import { gapToBestPct } from '@/utils/progress';
import type { MuscleGroup } from '@/types/exercises';
import type {
  MutedExercise,
  MutePayload,
  MuteResult,
  ProgressAlertsResponse,
  ProgressItem,
  ProgressParams,
  ProgressStatus,
  ProgressWindow,
  StatusCounts,
} from '@/types/progress';

export const SETTINGS_DEBOUNCE_MS = 250;

export type ProgressSort = 'priority' | 'name' | 'slope' | 'gap' | 'lastPR' | 'lastDone';

const SORTS: readonly ProgressSort[] = ['priority', 'name', 'slope', 'gap', 'lastPR', 'lastDone'];

function queryString(query: LocationQuery, key: string): string {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

function clampInt(raw: string, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function clampFloat(raw: string, min: number, max: number, fallback: number): number {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function paramsFromQuery(query: LocationQuery): ProgressParams {
  const window = queryString(query, 'window');
  const muscle = queryString(query, 'muscleGroup');
  return {
    window: WINDOWS.some((item) => item.value === window)
      ? (window as ProgressWindow)
      : PROGRESS_DEFAULTS.window,
    sessions: clampInt(
      queryString(query, 'sessions'),
      SESSIONS_RANGE.min,
      SESSIONS_RANGE.max,
      PROGRESS_DEFAULTS.sessions,
    ),
    staleWeeks: clampInt(
      queryString(query, 'staleWeeks'),
      STALE_RANGE.min,
      STALE_RANGE.max,
      PROGRESS_DEFAULTS.staleWeeks,
    ),
    threshold: clampFloat(
      queryString(query, 'threshold'),
      THRESHOLD_RANGE.min,
      THRESHOLD_RANGE.max,
      PROGRESS_DEFAULTS.threshold,
    ),
    muscleGroup: (MUSCLE_ORDER as readonly string[]).includes(muscle)
      ? (muscle as MuscleGroup)
      : null,
  };
}

const EMPTY_COUNTS: StatusCounts = {
  REGRESSING: 0,
  PLATEAU: 0,
  STALE: 0,
  PROGRESSING: 0,
  NOT_ENOUGH_DATA: 0,
};

export interface UseProgressAlerts {
  draft: ProgressParams;
  status: ComputedRef<ProgressStatus | null>;
  sort: ComputedRef<ProgressSort>;
  counts: ComputedRef<StatusCounts>;
  total: ComputedRef<number>;
  visible: ComputedRef<ProgressItem[]>;
  muted: ComputedRef<MutedExercise[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  hasLoaded: ComputedRef<boolean>;
  isDefault: ComputedRef<boolean>;
  mutingId: Ref<string | null>;
  muteError: Ref<string | null>;
  setStatus: (status: ProgressStatus | null) => void;
  setSort: (sort: ProgressSort) => void;
  updateDraft: (patch: Partial<ProgressParams>) => void;
  resetDefaults: () => void;
  mute: (item: ProgressItem, reason: string | null) => Promise<boolean>;
  unmute: (entry: MutedExercise) => Promise<boolean>;
  refresh: () => void;
}

export function useProgressAlerts(): UseProgressAlerts {
  const route = useRoute();
  const router = useRouter();

  const response = ref<ProgressAlertsResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const mutingId = ref<string | null>(null);
  const muteError = ref<string | null>(null);

  const params = computed(() => paramsFromQuery(route.query));

  const draft = reactive<ProgressParams>({ ...params.value });

  const status = computed<ProgressStatus | null>(() => {
    const value = queryString(route.query, 'status');
    return (STATUS_ORDER as readonly string[]).includes(value) ? (value as ProgressStatus) : null;
  });

  const sort = computed<ProgressSort>(() => {
    const value = queryString(route.query, 'sort');
    return (SORTS as readonly string[]).includes(value) ? (value as ProgressSort) : 'priority';
  });

  let controller: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function push(next: Record<string, string | undefined>): void {
    const query: Record<string, string> = { tab: 'progress' };
    for (const [key, value] of Object.entries({ ...route.query, ...next })) {
      if (typeof value === 'string' && value !== '' && key !== 'tab') {
        query[key] = value;
      }
    }
    void router.replace({ name: 'home', query });
  }

  function pushParams(next: ProgressParams): void {
    push({
      window: next.window === PROGRESS_DEFAULTS.window ? undefined : next.window,
      sessions: next.sessions === PROGRESS_DEFAULTS.sessions ? undefined : String(next.sessions),
      staleWeeks:
        next.staleWeeks === PROGRESS_DEFAULTS.staleWeeks ? undefined : String(next.staleWeeks),
      threshold:
        next.threshold === PROGRESS_DEFAULTS.threshold
          ? undefined
          : String(next.threshold),
      muscleGroup: next.muscleGroup ?? undefined,
    });
  }

  async function fetchAlerts(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    isLoading.value = true;
    error.value = null;

    const current = params.value;
    try {
      const result = await apiGet<ProgressAlertsResponse>(
        '/progress/alerts',
        {
          window: current.window,
          sessions: current.sessions,
          staleWeeks: current.staleWeeks,
          threshold: current.threshold,
          muscleGroup: current.muscleGroup ?? undefined,
        },
        signal,
      );
      if (signal.aborted) {
        return;
      }
      response.value = result;
    } catch (caught) {
      if (signal.aborted) {
        return;
      }
      error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  }

  watch(
    [() => JSON.stringify(params.value), dataVersion],
    () => {
      Object.assign(draft, params.value);
      void fetchAlerts();
    },
    { immediate: true },
  );

  function updateDraft(patch: Partial<ProgressParams>): void {
    Object.assign(draft, patch);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => pushParams({ ...draft }), SETTINGS_DEBOUNCE_MS);
  }

  function resetDefaults(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    Object.assign(draft, { ...PROGRESS_DEFAULTS, muscleGroup: null });
    pushParams({ ...draft });
  }

  const counts = computed(() => response.value?.counts ?? EMPTY_COUNTS);
  const total = computed(() => STATUS_ORDER.reduce((sum, key) => sum + counts.value[key], 0));

  const visible = computed(() => {
    const items = response.value?.items ?? [];
    const filtered = status.value ? items.filter((item) => item.status === status.value) : items;

    if (sort.value === 'priority') {
      return filtered;
    }

    const byNull = (value: number | null, fallback: number): number => value ?? fallback;
    const sorted = [...filtered];
    switch (sort.value) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'en'));
      case 'slope':
        return sorted.sort(
          (a, b) => byNull(a.slopePctPerWeek, Infinity) - byNull(b.slopePctPerWeek, Infinity),
        );
      case 'gap':
        return sorted.sort(
          (a, b) => byNull(gapToBestPct(a), Infinity) - byNull(gapToBestPct(b), Infinity),
        );
      case 'lastPR':
        return sorted.sort(
          (a, b) => byNull(b.weeksSincePR, -1) - byNull(a.weeksSincePR, -1),
        );
      case 'lastDone':
        return sorted.sort((a, b) => b.daysSinceLast - a.daysSinceLast);
    }
    return sorted;
  });

  const muted = computed(() => response.value?.muted ?? []);

  const isDefault = computed(
    () =>
      params.value.window === PROGRESS_DEFAULTS.window &&
      params.value.sessions === PROGRESS_DEFAULTS.sessions &&
      params.value.staleWeeks === PROGRESS_DEFAULTS.staleWeeks &&
      params.value.threshold === PROGRESS_DEFAULTS.threshold &&
      params.value.muscleGroup === null,
  );

  async function patchMute(exerciseId: string, payload: MutePayload): Promise<void> {
    await apiPatch<MuteResult>(`/progress/exercises/${encodeURIComponent(exerciseId)}/mute`, payload);
  }

  async function mute(item: ProgressItem, reason: string | null): Promise<boolean> {
    const current = response.value;
    if (!current) {
      return false;
    }
    const snapshot = current;

    const counts = { ...current.counts };
    counts[item.status] = Math.max(0, counts[item.status] - 1);
    response.value = {
      ...current,
      counts,
      items: current.items.filter((entry) => entry.exerciseId !== item.exerciseId),
      muted: [
        ...current.muted,
        { exerciseId: item.exerciseId, name: item.name, slug: item.slug, muteReason: reason },
      ],
    };

    mutingId.value = item.exerciseId;
    muteError.value = null;
    try {
      await patchMute(item.exerciseId, reason ? { muted: true, reason } : { muted: true });
      void fetchAlerts();
      return true;
    } catch (caught) {
      response.value = snapshot;
      muteError.value = caught instanceof ApiError ? caught.message : 'Could not mute.';
      return false;
    } finally {
      mutingId.value = null;
    }
  }

  async function unmute(entry: MutedExercise): Promise<boolean> {
    const current = response.value;
    if (!current) {
      return false;
    }
    const snapshot = current;

    response.value = {
      ...current,
      muted: current.muted.filter((muted) => muted.exerciseId !== entry.exerciseId),
    };

    mutingId.value = entry.exerciseId;
    muteError.value = null;
    try {
      await patchMute(entry.exerciseId, { muted: false });
      await fetchAlerts();
      return true;
    } catch (caught) {
      response.value = snapshot;
      muteError.value = caught instanceof ApiError ? caught.message : 'Could not unmute.';
      return false;
    } finally {
      mutingId.value = null;
    }
  }

  onScopeDispose(() => {
    controller?.abort();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  return {
    draft,
    status,
    sort,
    counts,
    total,
    visible,
    muted,
    isLoading,
    error,
    hasLoaded: computed(() => response.value !== null),
    isDefault,
    mutingId,
    muteError,
    setStatus: (next) => push({ status: next ?? undefined }),
    setSort: (next) => push({ sort: next === 'priority' ? undefined : next }),
    updateDraft,
    resetDefaults,
    mute,
    unmute,
    refresh: () => void fetchAlerts(),
  };
}
