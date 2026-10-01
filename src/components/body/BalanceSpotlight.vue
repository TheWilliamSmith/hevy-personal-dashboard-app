<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { MUSCLE_LABELS } from '@/constants/muscles';
import type { MuscleHeatmap, MuscleGroup } from '@/types/stats';
import { formatPercent, percentChange } from '@/utils/format';

const props = defineProps<{
  heatmap: MuscleHeatmap | null;
  mappedMuscles: readonly MuscleGroup[];
  rangeLabel: string;
  unit: string;
  format: (value: number) => string;
  isLoading: boolean;
}>();

const trained = computed(() =>
  props.heatmap ? props.mappedMuscles.filter((muscle) => (props.heatmap?.values[muscle] ?? 0) > 0) : [],
);

const leastTrained = computed(() => {
  const heatmap = props.heatmap;
  if (!heatmap) {
    return [];
  }
  return heatmap.leastTrained.slice(0, 3).map((muscle) => ({
    muscle,
    value: heatmap.values[muscle],
    change: percentChange(heatmap.values[muscle], heatmap.previous[muscle]),
  }));
});

function changeClass(change: number | null): string {
  if (change === null) {
    return 'text-zinc-600';
  }
  return change >= 0 ? 'text-emerald-400' : 'text-red-400';
}
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader :title="t('body.balance')" :subtitle="t('body.balanceSubtitle')" />

    <div>
      <p
        class="text-5xl font-semibold tracking-tight text-white tabular-nums"
        :class="{ 'animate-pulse text-zinc-700': isLoading && !heatmap }"
      >
        {{ trained.length }}<span class="text-3xl text-zinc-500"> / {{ mappedMuscles.length }}</span>
      </p>
      <p class="mt-2 max-w-xs text-sm text-zinc-400">
        <template v-if="heatmap?.topMuscle">
          {{ t('body.balanceSummary', { trained: trained.length, total: mappedMuscles.length, range: rangeLabel.toLowerCase() }) }}
          {{
            t('body.balanceLeader', {
              muscle: MUSCLE_LABELS[heatmap.topMuscle],
              value: format(heatmap.values[heatmap.topMuscle]),
              unit,
            })
          }}
        </template>
        <template v-else-if="heatmap">{{ t('body.noMuscle') }}</template>
        <template v-else>{{ t('body.loadingBalance') }}</template>
      </p>
    </div>

    <div v-if="leastTrained.length > 0" class="mt-auto flex flex-col gap-2">
      <p class="text-xs text-zinc-500">{{ t('body.leastTrained') }}</p>
      <ul class="flex flex-col gap-1">
        <li v-for="entry in leastTrained" :key="entry.muscle">
          <RouterLink
            :to="{ name: 'home', query: { tab: 'exercises', muscles: entry.muscle } }"
            class="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
          >
            <span class="h-2 w-2 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate text-zinc-200">{{ MUSCLE_LABELS[entry.muscle] }}</span>
            <span class="text-zinc-100 tabular-nums">{{ format(entry.value) }}</span>
            <span class="w-14 text-right text-xs tabular-nums" :class="changeClass(entry.change)">
              {{ entry.change === null ? '—' : formatPercent(entry.change) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
