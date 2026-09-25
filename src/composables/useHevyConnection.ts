import { computed, readonly, ref, type ComputedRef, type DeepReadonly, type Ref } from 'vue';

import { ApiError, apiDelete, apiGet, apiPost } from '@/lib/api';
import { invalidateWorkoutData } from '@/lib/data-version';
import type { ConnectHevyError, HevyConnectionState, HevySyncRun } from '@/types/hevy';
import type { Paginated } from '@/types/workouts';

export const API_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const POLL_INTERVAL_MS = 2000;

const state = ref<HevyConnectionState | null>(null);
const isLoading = ref(false);
const loadError = ref<string | null>(null);

const isConnecting = ref(false);
const connectError = ref<ConnectHevyError | null>(null);

const isDisconnecting = ref(false);
const disconnectError = ref<string | null>(null);

const activeRun = ref<HevySyncRun | null>(null);
const syncError = ref<string | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let loaded = false;

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function connectErrorFor(caught: unknown): ConnectHevyError {
  if (!(caught instanceof ApiError)) {
    return { kind: 'unknown', message: 'Something went wrong.' };
  }
  if (caught.status === null) {
    return { kind: 'network', message: 'Could not reach the server. Check your connection.' };
  }
  if (caught.status === 401 || caught.status === 403) {
    return { kind: 'rejected', message: 'Hevy rejected this key. Check it and try again.' };
  }
  if (caught.status === 402) {
    return {
      kind: 'not-pro',
      message: 'This account is not on Hevy Pro. The Hevy API requires a Pro subscription.',
    };
  }
  if (caught.status === 400 || caught.status === 422) {
    return { kind: 'invalid-format', message: 'That key is not in the expected format.' };
  }
  return { kind: 'unknown', message: caught.message };
}

async function fetchConnection(): Promise<void> {
  isLoading.value = true;
  loadError.value = null;

  try {
    const response = await apiGet<HevyConnectionState>('/hevy/connection');
    state.value = response;

    if (response.connected && response.activeSyncRunId && !pollTimer) {
      await attachToRun(response.activeSyncRunId);
    }
  } catch (caught) {
    loadError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
  } finally {
    isLoading.value = false;
  }
}

async function pollRun(id: string): Promise<void> {
  try {
    const run = await apiGet<HevySyncRun>(`/hevy/sync/runs/${encodeURIComponent(id)}`);
    activeRun.value = run;

    if (run.status !== 'RUNNING') {
      stopPolling();
      if (run.workoutsCreated + run.workoutsUpdated + run.workoutsDeleted > 0) {
        invalidateWorkoutData();
      }
      void fetchConnection();
    }
  } catch (caught) {
    stopPolling();
    syncError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
  }
}

function startPolling(id: string): void {
  stopPolling();
  pollTimer = setInterval(() => void pollRun(id), POLL_INTERVAL_MS);
}

async function attachToRun(id: string): Promise<void> {
  await pollRun(id);
  const current = activeRun.value;
  if (current?.status === 'RUNNING') {
    startPolling(id);
  }
}

async function attachToRunningRun(): Promise<void> {
  try {
    const response = await apiGet<Paginated<HevySyncRun>>('/hevy/sync/runs', {
      status: 'RUNNING',
      limit: 1,
    });
    const running = response.data[0];
    if (running) {
      activeRun.value = running;
      startPolling(running.id);
      return;
    }
    syncError.value = 'A sync is already running, but it could not be found. Try again in a moment.';
  } catch (caught) {
    syncError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
  }
}

async function connect(apiKey: string): Promise<boolean> {
  isConnecting.value = true;
  connectError.value = null;

  try {
    const response = await apiPost<HevyConnectionState>('/hevy/connection', { apiKey });
    state.value = response;
    return true;
  } catch (caught) {
    connectError.value = connectErrorFor(caught);
    return false;
  } finally {
    isConnecting.value = false;
  }
}

async function disconnect(): Promise<boolean> {
  isDisconnecting.value = true;
  disconnectError.value = null;

  try {
    await apiDelete<unknown>('/hevy/connection');
    stopPolling();
    activeRun.value = null;
    state.value = { connected: false };
    return true;
  } catch (caught) {
    disconnectError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
    return false;
  } finally {
    isDisconnecting.value = false;
  }
}

async function sync(full: boolean): Promise<void> {
  syncError.value = null;

  try {
    const run = await apiPost<HevySyncRun>(`/hevy/sync${full ? '?full=true' : ''}`, {});
    activeRun.value = run;
    startPolling(run.id);
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 409) {
      await attachToRunningRun();
      return;
    }
    syncError.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
  }
}

const indicatorTone: ComputedRef<'connected' | 'attention' | 'disconnected' | 'unknown'> = computed(
  () => {
    const current = state.value;
    if (current === null) {
      return 'unknown';
    }
    if (!current.connected) {
      return 'disconnected';
    }
    if (current.lastSyncStatus === 'FAILED' || current.lastSyncStatus === 'PARTIAL') {
      return 'attention';
    }
    if (current.hevyWorkoutCount > current.localWorkoutCount) {
      return 'attention';
    }
    return 'connected';
  },
);

export interface UseHevyConnection {
  state: DeepReadonly<Ref<HevyConnectionState | null>>;
  isLoading: Ref<boolean>;
  loadError: Ref<string | null>;
  isConnecting: Ref<boolean>;
  connectError: Ref<ConnectHevyError | null>;
  isDisconnecting: Ref<boolean>;
  disconnectError: Ref<string | null>;
  activeRun: DeepReadonly<Ref<HevySyncRun | null>>;
  syncError: Ref<string | null>;
  indicatorTone: ComputedRef<'connected' | 'attention' | 'disconnected' | 'unknown'>;
  refresh: () => Promise<void>;
  connect: (apiKey: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  sync: (full: boolean) => Promise<void>;
}

export function useHevyConnection(): UseHevyConnection {
  if (!loaded) {
    loaded = true;
    void fetchConnection();
  }

  return {
    state: readonly(state),
    isLoading,
    loadError,
    isConnecting,
    connectError,
    isDisconnecting,
    disconnectError,
    activeRun: readonly(activeRun),
    syncError,
    indicatorTone,
    refresh: fetchConnection,
    connect,
    disconnect,
    sync,
  };
}
