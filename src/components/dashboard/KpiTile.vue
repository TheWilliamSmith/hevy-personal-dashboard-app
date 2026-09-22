<script setup lang="ts">
import { computed } from 'vue';

import { formatPercent, percentChange } from '@/utils/format';

const props = defineProps<{
  label: string;
  value: string;
  current: number | null;
  previous: number | null;
  comparisonLabel: string | null;
  /** Lower is better for nothing here today, but duration could flip it. */
  invert?: boolean;
  isLoading?: boolean;
}>();

const delta = computed(() => percentChange(props.current, props.previous));

const isUp = computed(() => (delta.value ?? 0) >= 0);
const isGood = computed(() => (props.invert ? !isUp.value : isUp.value));

const deltaClass = computed(() =>
  delta.value === null ? 'text-slate-400' : isGood.value ? 'text-emerald-600' : 'text-red-600',
);
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
    <p class="truncate text-xs font-medium text-slate-500">{{ props.label }}</p>

    <template v-if="props.isLoading">
      <div class="mt-2 h-6 w-24 animate-pulse rounded bg-slate-200" />
      <div class="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
    </template>

    <template v-else>
      <p class="mt-1 truncate text-xl font-semibold text-slate-900">{{ props.value }}</p>

      <p v-if="delta !== null" class="mt-1 flex items-center gap-1 text-xs" :class="deltaClass">
        <span aria-hidden="true">{{ isUp ? '▲' : '▼' }}</span>
        <span>{{ formatPercent(delta) }}</span>
        <span class="truncate text-slate-400">{{ props.comparisonLabel }}</span>
      </p>
      <!-- No previous window (preset "All") means no honest comparison. -->
      <p v-else class="mt-1 text-xs text-slate-400">No comparison</p>
    </template>
  </div>
</template>
