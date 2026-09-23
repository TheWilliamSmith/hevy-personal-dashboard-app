<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { ATTENTION_STATUSES, STATUS_STYLES } from '@/constants/progress';
import type { ProgressSummary } from '@/types/progress';
import { formatSlope } from '@/utils/progress';

import ChartCard from './ChartCard.vue';

const props = defineProps<{
  summary: ProgressSummary | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const top = computed(() => props.summary?.topConcerns ?? []);
const attentionCount = computed(() =>
  ATTENTION_STATUSES.reduce((sum, status) => sum + (props.summary?.counts[status] ?? 0), 0),
);
</script>

<template>
  <ChartCard
    title="Needs attention"
    :subtitle="`${attentionCount} exercises regressing, on a plateau or stale`"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="props.summary !== null && attentionCount === 0"
    empty-label="Nothing needs attention right now."
    :height="220"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <RouterLink
        :to="{ name: 'home', query: { tab: 'progress' } }"
        aria-current-value="false"
        class="text-xs font-medium text-indigo-700 underline underline-offset-2"
      >
        Open Progress
      </RouterLink>
    </template>

    <div class="flex h-full flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-for="status in ATTENTION_STATUSES"
          :key="status"
          :to="{ name: 'home', query: { tab: 'progress', status } }"
          aria-current-value="false"
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          :class="STATUS_STYLES[status].pill"
        >
          {{ props.summary?.counts[status] ?? 0 }} {{ STATUS_STYLES[status].label.toLowerCase() }}
        </RouterLink>
      </div>

      <ul class="divide-y divide-slate-100">
        <li v-for="alert in top" :key="alert.exerciseId" class="flex items-center gap-2 py-1.5 text-sm">
          <span class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="STATUS_STYLES[alert.status].pill">
            {{ STATUS_STYLES[alert.status].label }}
          </span>
          <span class="min-w-0 flex-1 truncate text-slate-800">{{ alert.name }}</span>
          <span class="text-xs tabular-nums text-slate-500">{{ formatSlope(alert.slopePctPerWeek) }}</span>
        </li>
      </ul>
    </div>
  </ChartCard>
</template>
