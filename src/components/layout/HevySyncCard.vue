<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useHevyConnection } from '@/composables/useHevyConnection';
import { formatRelativeTime } from '@/utils/format';

const connection = useHevyConnection();

const connected = computed(() =>
  connection.state.value?.connected ? connection.state.value : null,
);

const isSyncing = computed(() => connection.activeRun.value !== null);

const title = computed(() => {
  if (connection.indicatorTone.value === 'unknown') {
    return t('sync.hevy');
  }
  if (!connected.value) {
    return t('sync.connectHevy');
  }
  return connected.value.username ? `@${connected.value.username}` : t('sync.hevyConnected');
});

const description = computed(() => {
  if (connection.indicatorTone.value === 'unknown') {
    return t('sync.checking');
  }
  if (!connected.value) {
    return t('sync.pitch');
  }
  if (isSyncing.value) {
    return t('sync.inProgress');
  }
  if (connection.indicatorTone.value === 'attention') {
    return t('sync.needsAttention');
  }
  return connected.value.lastSyncAt
    ? t('sync.syncedAgo', { when: formatRelativeTime(connected.value.lastSyncAt) })
    : t('sync.neverSynced');
});

const buttonClass =
  'flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60';
</script>

<template>
  <div class="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
    <p class="flex items-center gap-2 text-sm font-medium text-zinc-100">
      <span
        class="h-2 w-2 shrink-0 rounded-full"
        :class="{
          'bg-emerald-500': connection.indicatorTone.value === 'connected',
          'bg-amber-500': connection.indicatorTone.value === 'attention',
          'bg-zinc-500': connection.indicatorTone.value === 'disconnected',
          'bg-zinc-700': connection.indicatorTone.value === 'unknown',
        }"
        aria-hidden="true"
      />
      <span class="truncate">{{ title }}</span>
    </p>
    <p class="mt-1 text-xs text-zinc-400">{{ description }}</p>

    <button
      v-if="connected"
      type="button"
      :class="[buttonClass, 'mt-3']"
      :disabled="isSyncing"
      @click="connection.sync(false)"
    >
      {{ isSyncing ? t('sync.syncing') : t('sync.syncNow') }}
    </button>
    <RouterLink
      v-else-if="connection.indicatorTone.value === 'disconnected'"
      :to="{ name: 'home', query: { tab: 'settings', section: 'data' } }"
      :class="[buttonClass, 'mt-3']"
    >
      {{ t('sync.connect') }}
    </RouterLink>
  </div>
</template>
