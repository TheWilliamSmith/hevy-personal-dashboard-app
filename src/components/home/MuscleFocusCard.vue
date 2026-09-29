<script setup lang="ts">
import { computed } from 'vue';

import SectionError from '@/components/home/SectionError.vue';
import SectionHeader from '@/components/home/SectionHeader.vue';
import { MUSCLE_LABELS, MUSCLE_ORDER } from '@/constants/muscles';
import type { MuscleHeatmap } from '@/types/stats';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  heatmap: MuscleHeatmap | null;
  rangeLabel: string;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const BAR_COLORS = ['bg-emerald-500', 'bg-orange-400', 'bg-teal-600', 'bg-zinc-400', 'bg-indigo-400'];
const DOT_COLORS = ['bg-emerald-500', 'bg-orange-400', 'bg-teal-600', 'bg-zinc-400', 'bg-indigo-400'];

const totalSets = computed(() =>
  props.heatmap ? MUSCLE_ORDER.reduce((sum, muscle) => sum + (props.heatmap?.values[muscle] ?? 0), 0) : 0,
);

const rows = computed(() => {
  const heatmap = props.heatmap;
  if (!heatmap || totalSets.value === 0) {
    return [];
  }
  return MUSCLE_ORDER.map((muscle) => ({ muscle, sets: heatmap.values[muscle] }))
    .filter((row) => row.sets > 0)
    .sort((a, b) => b.sets - a.sets)
    .slice(0, 5)
    .map((row) => ({ ...row, share: (row.sets / totalSets.value) * 100 }));
});
</script>

<template>
  <section class="flex flex-col gap-5">
    <SectionHeader title="Muscle focus" :subtitle="`Share of working sets · ${rangeLabel}`">
      <p class="text-right">
        <span class="text-2xl font-semibold text-white tabular-nums">{{ formatInteger(totalSets) }}</span>
        <span class="block text-[11px] leading-tight text-zinc-500">Working sets</span>
      </p>
    </SectionHeader>

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <ul v-else-if="isLoading && !heatmap" class="flex flex-col gap-5" aria-hidden="true">
      <li v-for="index in 5" :key="index" class="h-6 animate-pulse rounded bg-zinc-900" />
    </ul>

    <p v-else-if="rows.length === 0" class="text-sm text-zinc-500">No working sets in this period.</p>

    <ul v-else class="flex flex-col gap-4">
      <li v-for="(row, index) in rows" :key="row.muscle">
        <div class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-2 text-zinc-200">
            <span class="h-2 w-2 rounded-full" :class="DOT_COLORS[index]" aria-hidden="true" />
            {{ MUSCLE_LABELS[row.muscle] }}
          </span>
          <span class="text-xs text-zinc-400 tabular-nums">{{ row.share.toFixed(1) }}%</span>
        </div>
        <div class="mt-1.5 h-2 rounded-full bg-zinc-900">
          <div class="h-full rounded-full" :class="BAR_COLORS[index]" :style="{ width: `${row.share}%` }" />
        </div>
      </li>
    </ul>
  </section>
</template>
