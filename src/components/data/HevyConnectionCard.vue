<script setup lang="ts">
import { computed, ref, watch, type DeepReadonly } from 'vue';

import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { API_KEY_PATTERN, useHevyConnection } from '@/composables/useHevyConnection';
import type { HevySyncRun } from '@/types/hevy';
import { formatDate, formatInteger, formatRelativeTime } from '@/utils/format';

const emit = defineEmits<{ syncFinished: [run: DeepReadonly<HevySyncRun>] }>();

const connection = useHevyConnection();

const apiKeyInput = ref('');
const showKey = ref(false);
const touched = ref(false);
const offerFirstSync = ref(false);

const pendingFullResync = ref(false);
const pendingDisconnect = ref(false);

const announcement = ref('');

const formatIsValid = computed(() => API_KEY_PATTERN.test(apiKeyInput.value.trim()));
const showFormatError = computed(
  () => touched.value && apiKeyInput.value.trim().length > 0 && !formatIsValid.value,
);

const isSyncing = computed(() => connection.activeRun.value?.status === 'RUNNING');

const connectedState = computed(() =>
  connection.state.value?.connected ? connection.state.value : null,
);

const drift = computed(() => {
  const current = connectedState.value;
  return current ? current.hevyWorkoutCount - current.localWorkoutCount : null;
});

const STATUS_LABELS: Readonly<Record<string, string>> = {
  RUNNING: 'Running',
  SUCCESS: 'Succeeded',
  PARTIAL: 'Partially succeeded',
  FAILED: 'Failed',
};

async function onConnect(): Promise<void> {
  touched.value = true;
  if (!formatIsValid.value) {
    return;
  }

  const key = apiKeyInput.value.trim();
  const ok = await connection.connect(key);
  apiKeyInput.value = '';
  touched.value = false;
  showKey.value = false;

  if (ok) {
    offerFirstSync.value = true;
    announcement.value = 'Connected to Hevy.';
  } else {
    announcement.value = connection.connectError.value?.message ?? 'Could not connect to Hevy.';
  }
}

async function startSync(full: boolean): Promise<void> {
  offerFirstSync.value = false;
  pendingFullResync.value = false;
  announcement.value = full ? 'Full resync started.' : 'Sync started.';
  await connection.sync(full);
}

async function onDisconnectConfirmed(): Promise<void> {
  const ok = await connection.disconnect();
  if (ok) {
    pendingDisconnect.value = false;
    announcement.value = 'Disconnected from Hevy. Synced data was kept.';
  }
}

watch(
  () => connection.activeRun.value,
  (run, previous) => {
    if (previous?.status === 'RUNNING' && run && run.status !== 'RUNNING') {
      announcement.value = `Sync ${STATUS_LABELS[run.status]?.toLowerCase() ?? 'finished'}.`;
      emit('syncFinished', run);
    }
  },
);
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5">
    <p role="status" aria-live="polite" class="sr-only">{{ announcement }}</p>

    <div v-if="connection.isLoading.value && connection.state.value === null" class="flex flex-col gap-2" aria-busy="true">
      <div class="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
      <div class="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
    </div>

    <p v-else-if="connection.loadError.value" class="text-sm text-red-900" role="alert">
      {{ connection.loadError.value }}
    </p>

    <template v-else-if="!connection.state.value?.connected">
      <h2 class="text-base font-semibold text-slate-900">Connect your Hevy account</h2>
      <p class="mt-2 text-sm text-slate-600">
        Connecting lets this dashboard pull your workouts from Hevy automatically, on a schedule
        or whenever you ask. You can still import a CSV export by hand at any time, and switch
        back to it if the connection ever stops working.
      </p>
      <p class="mt-2 text-sm text-slate-500">
        Requires a
        <a
          href="https://api.hevyapp.com/docs/"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-indigo-700 underline underline-offset-2"
        >
          Hevy API key
        </a>
        from a Hevy Pro account.
      </p>

      <form class="mt-4 flex flex-col gap-2" @submit.prevent="onConnect">
        <label for="hevy-api-key" class="text-sm font-medium text-slate-800">Hevy API key</label>
        <div class="flex gap-2">
          <input
            id="hevy-api-key"
            v-model="apiKeyInput"
            :type="showKey ? 'text' : 'password'"
            autocomplete="off"
            spellcheck="false"
            placeholder="00000000-0000-0000-0000-000000000000"
            aria-describedby="hevy-api-key-hint"
            :aria-invalid="showFormatError"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            :disabled="connection.isConnecting.value"
            @blur="touched = true"
          />
          <button
            type="button"
            class="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            @click="showKey = !showKey"
          >
            {{ showKey ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p id="hevy-api-key-hint" class="text-xs text-slate-500">
          Found in the Hevy app under Settings → API. This key is only held in the form and is
          never saved in your browser.
        </p>
        <p v-if="showFormatError" class="text-xs text-red-700" role="alert">
          That doesn't look like a Hevy API key. It should look like
          00000000-0000-0000-0000-000000000000.
        </p>
        <p v-if="connection.connectError.value" class="text-sm text-red-900" role="alert">
          {{ connection.connectError.value.message }}
        </p>

        <button
          type="submit"
          class="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="connection.isConnecting.value"
          :aria-busy="connection.isConnecting.value"
        >
          <span
            v-if="connection.isConnecting.value"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
          Connect
        </button>
      </form>

      <div
        v-if="offerFirstSync"
        class="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4"
      >
        <p class="text-sm text-indigo-900">
          Connected. Fetch your whole workout history now? This can take a minute — the Hevy API
          returns at most 10 workouts per request, so a long history means many requests.
        </p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            @click="startSync(true)"
          >
            Fetch full history
          </button>
          <button
            type="button"
            class="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
            @click="offerFirstSync = false"
          >
            Not now
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="connectedState">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Connected as {{ connectedState.username }}
          </p>
          <dl class="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-4">
            <div>
              <dt class="font-medium text-slate-600">Key</dt>
              <dd class="font-mono">{{ connectedState.keyMasked }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-600">Connected since</dt>
              <dd>{{ formatDate(connectedState.connectedAt) }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-600">Last sync</dt>
              <dd>{{ formatRelativeTime(connectedState.lastSyncAt) }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-600">Last sync status</dt>
              <dd>
                {{
                  connectedState.lastSyncStatus
                    ? STATUS_LABELS[connectedState.lastSyncStatus]
                    : '—'
                }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSyncing"
            :aria-busy="isSyncing"
            @click="startSync(false)"
          >
            <span
              v-if="isSyncing"
              class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            {{ isSyncing ? `Syncing… ${formatInteger(connection.activeRun.value?.requestCount ?? 0)} requests` : 'Sync now' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSyncing"
            @click="pendingFullResync = true"
          >
            Full resync
          </button>
          <button
            type="button"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSyncing"
            @click="pendingDisconnect = true"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div
        class="mt-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
      >
        <p v-if="drift === null" class="text-sm text-slate-500">—</p>
        <p v-else-if="drift <= 0" class="text-sm text-emerald-700">Up to date</p>
        <p v-else class="text-sm text-amber-800">
          Hevy has {{ formatInteger(connectedState?.hevyWorkoutCount) }} workouts, you have
          {{ formatInteger(connectedState?.localWorkoutCount) }}
        </p>
        <button
          v-if="drift !== null && drift > 0"
          type="button"
          class="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSyncing"
          @click="startSync(false)"
        >
          Sync now
        </button>
      </div>

      <p v-if="connection.syncError.value" class="mt-3 text-sm text-red-900" role="alert">
        {{ connection.syncError.value }}
      </p>
    </template>

    <ConfirmDialog
      :open="pendingFullResync"
      labelled-by="confirm-full-resync-title"
      title="Full resync"
      confirm-label="Start full resync"
      :is-busy="isSyncing"
      @cancel="pendingFullResync = false"
      @confirm="startSync(true)"
    >
      This re-reads your entire Hevy history instead of just what changed since the last sync. It
      can take a minute and uses many requests, since Hevy returns at most 10 workouts per
      request.
    </ConfirmDialog>

    <ConfirmDialog
      :open="pendingDisconnect"
      labelled-by="confirm-disconnect-title"
      title="Disconnect Hevy"
      confirm-label="Disconnect"
      tone="danger"
      :is-busy="connection.isDisconnecting.value"
      :error="connection.disconnectError.value"
      @cancel="pendingDisconnect = false"
      @confirm="onDisconnectConfirmed"
    >
      This stops automatic sync. All workouts already synced stay in your data — nothing is
      deleted. You can reconnect, or switch to CSV import, at any time.
    </ConfirmDialog>
  </section>
</template>
