<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { ATTENTION_STATUSES, STATUS_STYLES } from '@/constants/progress';
import type { ProgressItem, StatusCounts } from '@/types/progress';
import { formatInteger } from '@/utils/format';
import { formatDaysAgo, formatSlope } from '@/utils/progress';

const props = defineProps<{
  counts: StatusCounts;
  total: number;
  concerns: ProgressItem[];
  isLoading: boolean;
}>();

const needingAttention = computed(() =>
  ATTENTION_STATUSES.reduce((sum, status) => sum + props.counts[status], 0),
);

function detail(item: ProgressItem): string {
  return item.status === 'STALE'
    ? t('progress.attention.lastDone', { when: formatDaysAgo(item.daysSinceLast) })
    : formatSlope(item.slopePctPerWeek);
}
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader :title="t('progress.attention.title')" :subtitle="t('progress.attention.subtitle')" />

    <div>
      <p
        class="text-5xl font-semibold tracking-tight text-white tabular-nums"
        :class="{ 'animate-pulse text-zinc-700': isLoading && total === 0 }"
      >
        {{ formatInteger(needingAttention) }}
      </p>
      <p class="mt-2 max-w-xs text-sm text-zinc-400">
        <template v-if="needingAttention === 0 && total > 0">{{ t('progress.attention.allGood') }}</template>
        <template v-else-if="total > 0">
          {{ t('progress.attention.summary', { count: formatInteger(needingAttention), total: formatInteger(total) }) }}
        </template>
        <template v-else>{{ t('progress.attention.none') }}</template>
      </p>
    </div>

    <ul v-if="concerns.length > 0" class="mt-auto flex flex-col gap-1">
      <li v-for="item in concerns" :key="item.exerciseId">
        <RouterLink
          :to="{ name: 'home', query: { tab: 'exercises', exercise: item.slug } }"
          class="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
        >
          <span class="h-2 w-2 shrink-0 rounded-full" :class="STATUS_STYLES[item.status].dot" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate text-zinc-200">{{ item.name }}</span>
          <span class="text-xs whitespace-nowrap tabular-nums" :class="STATUS_STYLES[item.status].text">
            {{ detail(item) }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
