<script setup lang="ts">
import { t, translated } from '@/i18n';
import { computed, ref, watch, type DeepReadonly } from 'vue';

import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { API_KEY_PATTERN, useHevyConnection } from '@/composables/useHevyConnection';
import type { HevySyncRun } from '@/types/hevy';
import { formatInteger, formatRelativeTime } from '@/utils/format';

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

const STATUS_LABELS: Readonly<Record<string, string>> = translated(
  ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'],
  (status) => `data.syncStatus.${status}`,
);

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
    announcement.value = t('data.hevy.connected');
  } else {
    announcement.value = connection.connectError.value?.message ?? t('data.hevy.connectFailed');
  }
}

async function startSync(full: boolean): Promise<void> {
  offerFirstSync.value = false;
  pendingFullResync.value = false;
  announcement.value = full ? t('data.hevy.fullStarted') : t('data.hevy.syncStarted');
  await connection.sync(full);
}

async function onDisconnectConfirmed(): Promise<void> {
  const ok = await connection.disconnect();
  if (ok) {
    pendingDisconnect.value = false;
    announcement.value = t('data.hevy.disconnected');
  }
}

watch(
  () => connection.activeRun.value,
  (run, previous) => {
    if (previous?.status === 'RUNNING' && run && run.status !== 'RUNNING') {
      announcement.value = t('data.hevy.syncFinished', {
        status: STATUS_LABELS[run.status]?.toLowerCase() ?? t('data.hevy.finished'),
      });
      emit('syncFinished', run);
    }
  },
);

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const primary = `inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;
const outline = `rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${focus}`;
const secondary = `${outline} text-zinc-100`;
const danger = `${outline} text-red-400 hover:text-red-300`;
const link = 'font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300';
</script>

<template>
  <section class="flex flex-col gap-5">
    <p role="status" aria-live="polite" class="sr-only">{{ announcement }}</p>

    <SectionHeader
      :title="t('data.hevy.title')"
      :subtitle="connectedState ? t('data.hevy.subtitleConnected') : t('data.hevy.subtitleDisconnected')"
    >
      <span
        v-if="connection.state.value !== null"
        class="flex items-center gap-1.5 text-xs"
        :class="connectedState ? 'text-emerald-400' : 'text-zinc-500'"
      >
        <span class="h-2 w-2 rounded-full" :class="connectedState ? 'bg-emerald-400' : 'bg-zinc-600'" aria-hidden="true" />
        {{ connectedState ? t('data.hevy.badgeConnected') : t('data.hevy.badgeDisconnected') }}
      </span>
    </SectionHeader>

    <div v-if="connection.isLoading.value && connection.state.value === null" class="flex flex-col gap-3" aria-busy="true">
      <div class="h-5 w-1/3 animate-pulse rounded bg-zinc-900" />
      <div class="h-16 animate-pulse rounded-md bg-zinc-900" />
    </div>

    <p
      v-else-if="connection.loadError.value"
      class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200"
      role="alert"
    >
      {{ connection.loadError.value }}
    </p>

    <template v-else-if="!connection.state.value?.connected">
      <i18n-t keypath="data.hevy.intro" tag="p" scope="global" class="max-w-prose text-sm text-zinc-400">
        <template #link>
          <a href="https://api.hevyapp.com/docs/" target="_blank" rel="noopener noreferrer" :class="link">{{
            t('data.hevy.apiKeyLink')
          }}</a>
        </template>
      </i18n-t>

      <form class="flex max-w-xl flex-col gap-2" @submit.prevent="onConnect">
        <label for="hevy-api-key" class="text-xs text-zinc-400">{{ t('data.hevy.apiKey') }}</label>
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
            class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
            :class="focus"
            :disabled="connection.isConnecting.value"
            @blur="touched = true"
          />
          <button type="button" :class="[secondary, 'shrink-0 text-xs']" @click="showKey = !showKey">
            {{ showKey ? t('data.hevy.hide') : t('data.hevy.show') }}
          </button>
        </div>
        <p id="hevy-api-key-hint" class="text-xs text-zinc-500">
          {{ t('data.hevy.keyHint') }}
        </p>
        <p v-if="showFormatError" class="text-xs text-red-400" role="alert">
          {{ t('data.hevy.keyFormat', { example: '00000000-0000-0000-0000-000000000000' }) }}
        </p>
        <p v-if="connection.connectError.value" class="text-sm text-red-400" role="alert">
          {{ connection.connectError.value.message }}
        </p>

        <button
          type="submit"
          :class="[primary, 'mt-2 self-start']"
          :disabled="connection.isConnecting.value"
          :aria-busy="connection.isConnecting.value"
        >
          <span
            v-if="connection.isConnecting.value"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
            aria-hidden="true"
          />
          {{ t('data.hevy.connect') }}
        </button>
      </form>

      <div v-if="offerFirstSync" class="max-w-xl rounded-md border border-blue-500/40 bg-blue-500/10 p-4">
        <p class="text-sm text-zinc-200">
          {{ t('data.hevy.firstSync') }}
        </p>
        <div class="mt-3 flex gap-2">
          <button type="button" :class="primary" @click="startSync(true)">{{ t('data.hevy.fetchAll') }}</button>
          <button type="button" :class="secondary" @click="offerFirstSync = false">{{ t('data.hevy.notNow') }}</button>
        </div>
      </div>
    </template>

    <template v-else-if="connectedState">
      <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div class="flex flex-col-reverse">
          <dt class="mt-0.5 text-xs text-zinc-500">{{ t('data.hevy.account') }}</dt>
          <dd class="truncate text-sm text-zinc-100">{{ connectedState.username ?? '—' }}</dd>
        </div>
        <div class="flex flex-col-reverse">
          <dt class="mt-0.5 text-xs text-zinc-500">{{ t('data.hevy.apiKeyShort') }}</dt>
          <dd class="truncate font-mono text-sm text-zinc-100">
            {{ connectedState.apiKeyLast4 ? `•••• ${connectedState.apiKeyLast4}` : '—' }}
          </dd>
        </div>
        <div class="flex flex-col-reverse">
          <dt class="mt-0.5 text-xs text-zinc-500">{{ t('data.hevy.workouts') }}</dt>
          <dd class="text-sm text-zinc-100 tabular-nums">
            {{ formatInteger(connectedState.workoutsLocal) }}
            <span class="text-zinc-500">{{ t('data.hevy.onHevy', { count: formatInteger(connectedState.workoutsInHevy) }) }}</span>
          </dd>
        </div>
        <div class="flex flex-col-reverse">
          <dt class="mt-0.5 text-xs text-zinc-500">{{ t('data.hevy.lastSync') }}</dt>
          <dd class="text-sm text-zinc-100">
            {{ formatRelativeTime(connectedState.lastSyncAt) }}
            <span v-if="connectedState.lastSyncStatus" class="text-zinc-500">
              · {{ STATUS_LABELS[connectedState.lastSyncStatus]?.toLowerCase() }}
            </span>
          </dd>
        </div>
      </dl>

      <div class="flex flex-wrap gap-2">
        <button type="button" :class="primary" :disabled="isSyncing" :aria-busy="isSyncing" @click="startSync(false)">
          <span
            v-if="isSyncing"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
            aria-hidden="true"
          />
          {{
            isSyncing
              ? t('data.hevy.syncingRequests', { count: formatInteger(connection.activeRun.value?.requestCount ?? 0) })
              : t('data.hevy.syncNow')
          }}
        </button>
        <button type="button" :class="secondary" :disabled="isSyncing" @click="pendingFullResync = true">
          {{ t('data.hevy.fullResync') }}
        </button>
        <button
          type="button"
          :class="danger"
          :disabled="isSyncing"
          @click="pendingDisconnect = true"
        >
          {{ t('data.hevy.disconnect') }}
        </button>
      </div>

      <p
        v-if="connection.syncError.value"
        class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200"
        role="alert"
      >
        {{ connection.syncError.value }}
      </p>
    </template>

    <ConfirmDialog
      :open="pendingFullResync"
      labelled-by="confirm-full-resync-title"
      :title="t('data.hevy.fullResync')"
      :confirm-label="t('data.hevy.startFullResync')"
      :is-busy="isSyncing"
      @cancel="pendingFullResync = false"
      @confirm="startSync(true)"
    >
      {{ t('data.hevy.fullResyncBody') }}
    </ConfirmDialog>

    <ConfirmDialog
      :open="pendingDisconnect"
      labelled-by="confirm-disconnect-title"
      :title="t('data.hevy.disconnectTitle')"
      :confirm-label="t('data.hevy.disconnect')"
      tone="danger"
      :is-busy="connection.isDisconnecting.value"
      :error="connection.disconnectError.value"
      @cancel="pendingDisconnect = false"
      @confirm="onDisconnectConfirmed"
    >
      {{ t('data.hevy.disconnectBody') }}
    </ConfirmDialog>
  </section>
</template>
