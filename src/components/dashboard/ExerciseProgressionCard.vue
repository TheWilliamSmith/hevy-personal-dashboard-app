<script setup lang="ts">
import { computed, ref } from 'vue';
import type { EChartsOption } from 'echarts';

import BaseChart from './BaseChart.vue';
import ChartCard from './ChartCard.vue';
import MetricSwitcher from './MetricSwitcher.vue';
import type { ProgressionMetric, ProgressionPoint } from '@/types/stats';
import { baseOption, categoryAxis, METRIC_COLORS, resolveTheme, valueAxis } from '@/charts/theme';
import { linearTrend } from '@/charts/trendline';
import { EMPTY, formatDate, formatInteger, formatVolume, formatWeight } from '@/utils/format';

const props = defineProps<{
  points: ProgressionPoint[] | null;
  exercises: string[];
  selected: string;
  metric: ProgressionMetric;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  retry: [];
  select: [name: string];
  metric: [value: ProgressionMetric];
}>();

const METRICS: ReadonlyArray<{ value: ProgressionMetric; label: string }> = [
  { value: 'maxWeight', label: 'Max weight' },
  { value: 'est1RM', label: 'Est. 1RM' },
  { value: 'volume', label: 'Volume' },
];

const search = ref('');
const palette = resolveTheme();

/** Picker is searchable; the list is fed by the top-exercises ranking. */
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return term ? props.exercises.filter((name) => name.toLowerCase().includes(term)) : props.exercises;
});

const rows = computed(() => props.points ?? []);
const hasData = computed(() => rows.value.length > 0);

const values = computed(() => rows.value.map((point) => point.value));
const trend = computed(() => linearTrend(values.value));

/** Volume keeps the volume hue; weight-based metrics share the sets hue. */
const color = computed(() =>
  props.metric === 'volume' ? METRIC_COLORS.volume : METRIC_COLORS.sets,
);

function render(value: number): string {
  if (props.metric === 'volume') {
    return formatVolume(value);
  }
  if (props.metric === 'totalReps') {
    return formatInteger(value);
  }
  return `${formatWeight(value)} kg`;
}

const labels = computed(() => rows.value.map((point) => formatDate(point.date)));

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    formatter: (params: unknown) => {
      const entries = params as Array<{ dataIndex: number }>;
      const index = entries[0]?.dataIndex ?? 0;
      const point = rows.value[index];
      if (!point) {
        return '';
      }
      return [
        `<strong>${labels.value[index] ?? ''}</strong>`,
        render(point.value),
        `Set: ${point.weightKg === null ? EMPTY : `${formatWeight(point.weightKg)} kg`} × ${point.reps ?? EMPTY}`,
      ].join('<br/>');
    },
  },
  grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
  xAxis: { ...categoryAxis(palette), data: labels.value },
  yAxis: { ...valueAxis(palette, props.metric === 'totalReps' ? 'reps' : 'kg'), scale: true },
  series: [
    {
      name: 'Session',
      type: 'line',
      symbolSize: 5,
      lineStyle: { color: color.value, width: 2 },
      itemStyle: { color: color.value },
      data: values.value,
    },
    ...(trend.value
      ? [
          {
            name: 'Trend',
            type: 'line' as const,
            symbol: 'none' as const,
            lineStyle: { color: palette.mutedText, width: 1.5, type: 'dashed' as const },
            data: trend.value.points,
          },
        ]
      : []),
  ],
}));
</script>

<template>
  <ChartCard
    title="Exercise progression"
    :subtitle="props.selected || 'Pick an exercise'"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    empty-label="No sessions for this exercise in this period."
    :height="420"
    :aria-label="`Progression for ${props.selected}`"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <MetricSwitcher
        :options="METRICS"
        :model-value="props.metric"
        label="Progression metric"
        @update:model-value="emit('metric', $event as ProgressionMetric)"
      />
    </template>

    <div class="flex h-full flex-col gap-2">
      <div class="flex gap-2">
        <label class="sr-only" for="progression-search">Search exercises</label>
        <input
          id="progression-search"
          v-model="search"
          type="search"
          placeholder="Search…"
          class="w-32 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
        />
        <label class="sr-only" for="progression-exercise">Exercise</label>
        <select
          id="progression-exercise"
          class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          :value="props.selected"
          @change="emit('select', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="name in filtered" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>

      <div class="min-h-0 flex-1">
        <BaseChart :option="option" />
      </div>
    </div>

    <template #fallback>
      <table>
        <caption>Progression for {{ props.selected }}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(point, index) in rows" :key="`${point.workoutId}-${point.date}`">
            <th scope="row">{{ labels[index] }}</th>
            <td>{{ render(point.value) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ChartCard>
</template>
