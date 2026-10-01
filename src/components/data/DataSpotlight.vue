<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { useStatsOverview } from '@/composables/stats';
import { useHevyConnection } from '@/composables/useHevyConnection';
import { formatDay, formatInteger, formatRelativeTime } from '@/utils/format';

const overview = useStatsOverview({});
const connection = useHevyConnection();

const stats = computed(() => overview.data.value);

const connected = computed(() =>
  connection.state.value?.connected ? connection.state.value : null,
);

const missing = computed(() => {
  const current = connected.value;
  return current ? Math.max(0, current.drift ?? 0) : null;
});
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader :title="t('data.spotlight.title')" :subtitle="t('data.spotlight.subtitle')" />

    <div>
      <p
        class="text-5xl font-semibold tracking-tight text-white tabular-nums"
        :class="{ 'animate-pulse text-zinc-700': overview.isLoading.value && !stats }"
      >
        {{ formatInteger(stats?.totalWorkouts ?? 0) }}
      </p>
      <p class="mt-2 max-w-xs text-sm text-zinc-400">
        <template v-if="stats?.firstWorkoutAt && stats.lastWorkoutAt">
          {{ t('data.spotlight.range', { from: formatDay(stats.firstWorkoutAt), to: formatDay(stats.lastWorkoutAt) }) }}
        </template>
        <template v-else-if="stats">{{ t('data.spotlight.empty') }}</template>
      </p>
    </div>

    <ul class="mt-auto flex flex-col gap-1 text-sm">
      <li class="flex items-center gap-3 rounded-md px-2 py-2">
        <span
          class="h-2 w-2 shrink-0 rounded-full"
          :class="!connected ? 'bg-zinc-600' : missing ? 'bg-amber-400' : 'bg-emerald-400'"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1 text-zinc-200">{{ t('data.spotlight.hevySync') }}</span>
        <span class="text-xs" :class="!connected ? 'text-zinc-500' : missing ? 'text-amber-400' : 'text-emerald-400'">
          <template v-if="!connected">{{ t('data.spotlight.notConnected') }}</template>
          <template v-else-if="missing">{{ t('data.spotlight.behind', { count: formatInteger(missing) }) }}</template>
          <template v-else>{{ t('data.spotlight.upToDate') }}</template>
        </span>
      </li>
      <li v-if="connected" class="flex items-center gap-3 rounded-md px-2 py-2">
        <span class="h-2 w-2 shrink-0 rounded-full bg-zinc-600" aria-hidden="true" />
        <span class="min-w-0 flex-1 text-zinc-200">{{ t('data.spotlight.lastSync') }}</span>
        <span class="text-xs text-zinc-400">{{ formatRelativeTime(connected.lastSyncAt) }}</span>
      </li>
    </ul>
  </section>
</template>
