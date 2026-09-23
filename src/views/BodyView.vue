<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import BodyHeatmap from '@/components/charts/BodyHeatmap.vue';
import MetricSwitcher from '@/components/dashboard/MetricSwitcher.vue';
import { useDashboardFilters, useMuscleHeatmap } from '@/composables/stats';
import { RANGE_PRESETS, type RangePreset } from '@/composables/stats/useDashboardFilters';
import { MUSCLE_LABELS } from '@/constants/muscles';
import type { HeatmapMetric, MuscleGroup } from '@/types/stats';
import { formatInteger, formatPercent, formatVolume, percentChange } from '@/utils/format';

const router = useRouter();
const filters = useDashboardFilters();

const metric = ref<HeatmapMetric>('sets');
const includeSecondary = ref(true);
const view = ref<'both' | 'front' | 'back'>('both');
const hovered = ref<MuscleGroup | null>(null);

const heatmap = useMuscleHeatmap(
  () => filters.range.value,
  () => metric.value,
  () => includeSecondary.value,
);

const METRICS: ReadonlyArray<{ value: HeatmapMetric; label: string }> = [
  { value: 'sets', label: 'Sets' },
  { value: 'volume', label: 'Volume' },
  { value: 'reps', label: 'Reps' },
];

const VIEWS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'both', label: 'Both' },
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
];

const RANGES = RANGE_PRESETS.map((preset) => ({ value: preset.value, label: preset.label }));

const data = computed(() => heatmap.data.value);
const values = computed(() => data.value?.values ?? {});
const max = computed(() => data.value?.max ?? 0);
const unit = computed(() => (metric.value === 'volume' ? 'kg' : metric.value));
const isEmpty = computed(() => data.value !== null && max.value <= 0);

const entries = computed(() => {
  const payload = data.value;
  if (!payload) {
    return [];
  }
  return (Object.keys(payload.values) as MuscleGroup[])
    .map((muscleGroup) => ({
      muscleGroup,
      value: payload.values[muscleGroup],
      change: percentChange(payload.values[muscleGroup], payload.previous[muscleGroup]),
    }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value);
});

function renderValue(value: number): string {
  return metric.value === 'volume' ? formatVolume(value) : formatInteger(value);
}

function share(value: number): number {
  return max.value > 0 ? Math.round((value / max.value) * 100) : 0;
}

function exerciseQuery(group: MuscleGroup) {
  return { name: 'home' as const, query: { tab: 'exercises', muscles: group } };
}
</script>

<template>
  <div class="flex flex-col gap-3 px-4 sm:px-6">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <MetricSwitcher
        :options="RANGES"
        :model-value="filters.preset.value"
        label="Date range"
        @update:model-value="filters.setPreset($event as RangePreset)"
      />
      <MetricSwitcher
        :options="METRICS"
        :model-value="metric"
        label="Metric"
        @update:model-value="metric = $event as HeatmapMetric"
      />
      <MetricSwitcher
        :options="VIEWS"
        :model-value="view"
        label="Figure view"
        @update:model-value="view = $event as 'both' | 'front' | 'back'"
      />
      <label class="flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <input v-model="includeSecondary" type="checkbox" />
        Count secondary muscles
      </label>
    </div>

    <div
      v-if="heatmap.error.value"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      role="alert"
    >
      <p class="text-sm text-red-900">{{ heatmap.error.value }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="heatmap.refresh"
      >
        Retry
      </button>
    </div>

    <div
      v-else
      class="grid min-h-[380px] gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]"
      style="height: calc(100dvh - 13.5rem)"
    >
      <section
        class="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3"
        :aria-busy="heatmap.isLoading.value"
      >
        <div
          v-if="heatmap.isLoading.value && !data"
          class="flex-1 animate-pulse rounded-lg bg-slate-100"
        />
        <div v-else-if="isEmpty" class="flex flex-1 flex-col items-center justify-center gap-2">
          <p class="text-sm text-slate-600">No training in this period.</p>
          <RouterLink
            :to="{ name: 'home', query: { tab: 'imports' } }"
            aria-current-value="false"
            class="text-sm font-medium text-indigo-700 underline underline-offset-2"
          >
            Import your Hevy export
          </RouterLink>
        </div>
        <BodyHeatmap
          v-else
          class="min-h-0 flex-1"
          :values="values"
          :unit="unit"
          :view="view"
          :highlight="hovered"
          :format="renderValue"
          @select="(group) => router.push(exerciseQuery(group))"
        />
      </section>

      <section class="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
        <header class="border-b border-slate-100 px-3 py-2">
          <h2 class="text-sm font-semibold text-slate-900">Ranking</h2>
          <p class="text-xs text-slate-500">Change vs the previous period</p>
        </header>

        <ul class="min-h-0 flex-1 overflow-y-auto py-1" @pointerleave="hovered = null">
          <li v-for="entry in entries" :key="entry.muscleGroup">
            <RouterLink
              :to="exerciseQuery(entry.muscleGroup)"
              aria-current-value="false"
              class="block px-3 py-1.5 text-xs transition-colors hover:bg-slate-50"
              :class="hovered === entry.muscleGroup ? 'bg-slate-50' : ''"
              @pointerenter="hovered = entry.muscleGroup"
              @focus="hovered = entry.muscleGroup"
              @blur="hovered = null"
            >
              <span class="flex items-baseline gap-2">
                <span class="min-w-0 flex-1 truncate font-medium text-slate-800">
                  {{ MUSCLE_LABELS[entry.muscleGroup] }}
                </span>
                <span class="tabular-nums text-slate-900">{{ renderValue(entry.value) }}</span>
                <span
                  class="w-14 text-right whitespace-nowrap tabular-nums"
                  :class="
                    entry.change === null
                      ? 'text-slate-300'
                      : entry.change >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                  "
                >
                  {{ entry.change === null ? '—' : formatPercent(entry.change) }}
                </span>
              </span>
              <span class="mt-1 block h-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  class="block h-full rounded-full bg-blue-600"
                  :style="{ width: `${share(entry.value)}%` }"
                />
              </span>
            </RouterLink>
          </li>
        </ul>

        <p
          v-if="data && data.leastTrained.length > 0"
          class="border-t border-slate-100 px-3 py-2 text-xs text-slate-600"
        >
          Least trained:
          <template v-for="(group, index) in data.leastTrained" :key="group">
            <RouterLink
              :to="exerciseQuery(group)"
              aria-current-value="false"
              class="font-medium text-indigo-700 underline underline-offset-2"
            >
              {{ MUSCLE_LABELS[group] }}
            </RouterLink><span v-if="index < data.leastTrained.length - 1">, </span>
          </template>
        </p>
      </section>
    </div>
  </div>
</template>
