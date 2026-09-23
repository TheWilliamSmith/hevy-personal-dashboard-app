<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import BodyHeatmap from '@/components/charts/BodyHeatmap.vue';
import ChartCard from './ChartCard.vue';
import MetricSwitcher from './MetricSwitcher.vue';
import { MUSCLE_LABELS } from '@/constants/muscles';
import type {
  HeatmapMetric,
  MuscleGroup,
  MuscleGroupValues,
  MuscleHeatmap,
} from '@/types/stats';
import { formatInteger, formatPercent, formatVolume, percentChange } from '@/utils/format';

const props = defineProps<{
  heatmap: MuscleHeatmap | null;
  metric: HeatmapMetric;
  includeSecondary: boolean;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  retry: [];
  metric: [value: HeatmapMetric];
  toggleSecondary: [];
}>();

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

const view = ref<'both' | 'front' | 'back'>('both');

/**
 * The hovered row is held here and passed down, so the figure and the list
 * never keep two copies of the same state.
 */
const hovered = ref<MuscleGroup | null>(null);

/** BodyHeatmap already takes this record shape, so it is passed straight down. */
const values = computed<MuscleGroupValues | Record<string, never>>(
  () => props.heatmap?.values ?? {},
);

/**
 * The API sends a record keyed by every group, including zeros. The ranked
 * list drops the zeros — an untrained group is noise in a ranking — and sorts
 * descending, since the payload has no inherent order.
 */
const entries = computed(() => {
  const heatmap = props.heatmap;
  if (!heatmap) {
    return [];
  }

  return (Object.keys(heatmap.values) as MuscleGroup[])
    .map((muscleGroup) => ({
      muscleGroup,
      value: heatmap.values[muscleGroup],
      previousValue: heatmap.previous[muscleGroup],
      weeklyAverage: heatmap.weeklyAverage[muscleGroup],
    }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value);
});

const max = computed(() => props.heatmap?.max ?? 0);

/** The DTO carries no unit; it follows from the metric. */
const unit = computed(() => (props.metric === 'volume' ? 'kg' : props.metric));

const isEmpty = computed(() => max.value <= 0);

/** Volume is kilos; sets and reps are counts. */
function renderValue(value: number): string {
  return props.metric === 'volume' ? formatVolume(value) : formatInteger(value);
}

function share(value: number): number {
  return max.value > 0 ? Math.round((value / max.value) * 100) : 0;
}

const leastTrained = computed(() => props.heatmap?.leastTrained ?? []);

/** Links into the Exercises tab, filtered on that group. */
function exerciseQuery(group: MuscleGroup) {
  return { name: 'home' as const, query: { tab: 'exercises', muscles: group } };
}
</script>

<template>
  <div class="flex h-full flex-col bg-white">
      <ChartCard
      class="min-h-0 flex-1"
      title="Muscle balance"
      :subtitle="`${METRICS.find((item) => item.value === props.metric)?.label ?? ''} per muscle group`"
      :is-loading="props.isLoading"
      :error="props.error"
      :is-empty="isEmpty"
      empty-label="No training in this period."
      :height="460"
      :aria-label="`Training balance across muscle groups, in ${unit}`"
      @retry="emit('retry')"
  >
      <template #toolbar>
      <div class="flex flex-wrap items-center gap-2">
        <MetricSwitcher
          :options="METRICS"
          :model-value="props.metric"
          label="Balance metric"
          @update:model-value="emit('metric', $event as HeatmapMetric)"
        />
        <MetricSwitcher
          :options="VIEWS"
          :model-value="view"
          label="Figure view"
          @update:model-value="view = $event as 'both' | 'front' | 'back'"
        />
        <label class="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            :checked="props.includeSecondary"
            @change="emit('toggleSecondary')"
          />
          Count secondary
        </label>
      </div>
      </template>

    <div class="flex h-full min-h-0 gap-4 overflow-hidden">
      <div class="min-w-0 flex-1 overflow-y-auto">
        <BodyHeatmap
          :values="values"
          :unit="unit"
          :view="view"
          :highlight="hovered"
          :format="renderValue"
          @select="(group) => $router.push(exerciseQuery(group))"
        />
      </div>

      <!-- Ranked list: same numbers, readable without pointing at the figure. -->
      <ul
        class="w-52 shrink-0 overflow-y-auto pr-1 text-xs"
        @pointerleave="hovered = null"
      >
        <li v-for="entry in entries" :key="entry.muscleGroup">
          <RouterLink
            :to="exerciseQuery(entry.muscleGroup)"
            aria-current-value="false"
            class="block rounded px-1.5 py-1 transition-colors hover:bg-slate-100"
            :class="hovered === entry.muscleGroup ? 'bg-slate-100' : ''"
            @pointerenter="hovered = entry.muscleGroup"
            @focus="hovered = entry.muscleGroup"
            @blur="hovered = null"
          >
            <span class="flex items-baseline justify-between gap-2">
              <span class="truncate font-medium text-slate-700">
                {{ MUSCLE_LABELS[entry.muscleGroup] }}
              </span>
              <span class="shrink-0 tabular-nums text-slate-900">
                {{ renderValue(entry.value) }}
              </span>
            </span>

            <span class="mt-1 flex items-center gap-1.5">
              <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <span
                  class="block h-full rounded-full bg-indigo-500"
                  :style="{ width: `${share(entry.value)}%` }"
                />
              </span>
              <!-- No previous window means no honest delta to show. -->
              <!-- nowrap: "+42,9 %" was breaking across two lines. -->
              <span
                v-if="percentChange(entry.value, entry.previousValue) !== null"
                class="w-[3.75rem] shrink-0 text-right text-[10px] whitespace-nowrap tabular-nums"
                :class="
                  (percentChange(entry.value, entry.previousValue) ?? 0) >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                "
              >
                <span aria-hidden="true">
                  {{ (percentChange(entry.value, entry.previousValue) ?? 0) >= 0 ? '▲' : '▼' }}
                </span>
                {{ formatPercent(percentChange(entry.value, entry.previousValue)) }}
              </span>
              <span v-else class="w-[3.75rem] shrink-0 text-right text-[10px] text-slate-300">—</span>
            </span>
          </RouterLink>
        </li>
      </ul>
      </div>

      <template #fallback>
      <table>
        <caption>Training per muscle group, in {{ unit }}</caption>
        <thead>
          <tr>
            <th scope="col">Muscle group</th>
            <th scope="col">{{ unit }}</th>
            <th scope="col">Share of top</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.muscleGroup">
            <th scope="row">{{ MUSCLE_LABELS[entry.muscleGroup] }}</th>
            <td>{{ renderValue(entry.value) }}</td>
            <td>{{ share(entry.value) }} %</td>
          </tr>
        </tbody>
      </table>
      </template>
      </ChartCard>

      <!-- Insight line, under the figure but inside the same card. -->
      <p
      v-if="leastTrained.length > 0 && !props.isLoading && !props.error"
      class="border-t border-slate-100 px-4 py-2 text-xs text-slate-600"
      >
      Least trained:
      <template v-for="(group, index) in leastTrained" :key="group">
        <RouterLink
          :to="exerciseQuery(group)"
          aria-current-value="false"
          class="font-medium text-indigo-700 underline underline-offset-2"
        >
          {{ MUSCLE_LABELS[group] }}
        </RouterLink><span v-if="index < leastTrained.length - 1">, </span>
      </template>
      </p>
  </div>
</template>
