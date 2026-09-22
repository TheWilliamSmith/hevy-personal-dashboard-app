<script setup lang="ts">
import { computed, ref } from 'vue';
import type { EChartsOption } from 'echarts';

import BaseChart from '@/components/dashboard/BaseChart.vue';
import ChartCard from '@/components/dashboard/ChartCard.vue';
import MetricSwitcher from '@/components/dashboard/MetricSwitcher.vue';
import { baseOption, categoryAxis, METRIC_COLORS, resolveTheme, valueAxis } from '@/charts/theme';
import { linearTrend } from '@/charts/trendline';
import type { ExerciseKind, ProgressionPoint } from '@/types/exercises';
import {
  EMPTY,
  formatDay,
  formatDistanceKm,
  formatDuration,
  formatInteger,
  formatPace,
  formatVolume,
  formatWeight,
} from '@/utils/format';

const props = defineProps<{
  points: ProgressionPoint[];
  kind: ExerciseKind;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

type StrengthMetric = 'maxWeight' | 'est1RM' | 'volume' | 'totalReps';
type CardioMetric = 'distance' | 'duration' | 'pace';
type Metric = StrengthMetric | CardioMetric;

const STRENGTH_METRICS: ReadonlyArray<{ value: Metric; label: string }> = [
  { value: 'maxWeight', label: 'Max weight' },
  { value: 'est1RM', label: 'Est. 1RM' },
  { value: 'volume', label: 'Volume' },
  { value: 'totalReps', label: 'Reps' },
];

const CARDIO_METRICS: ReadonlyArray<{ value: Metric; label: string }> = [
  { value: 'distance', label: 'Distance' },
  { value: 'duration', label: 'Duration' },
  { value: 'pace', label: 'Pace' },
];

const RANGES: ReadonlyArray<{ value: string; label: string; days: number | null }> = [
  { value: '3m', label: '3m', days: 90 },
  { value: '6m', label: '6m', days: 180 },
  { value: '1y', label: '1y', days: 365 },
  { value: 'all', label: 'All', days: null },
];

const isCardio = computed(() => props.kind === 'CARDIO');
const metrics = computed(() => (isCardio.value ? CARDIO_METRICS : STRENGTH_METRICS));

const metric = ref<Metric>('est1RM');
const range = ref('all');
const showTrend = ref(false);
const palette = resolveTheme();

// Switching kind can leave a metric that does not exist for it selected.
const activeMetric = computed<Metric>(() => {
  const allowed = metrics.value.map((item) => item.value);
  return allowed.includes(metric.value) ? metric.value : (allowed[0] ?? 'est1RM');
});

/** Every metric is already in the payload, so switching never refetches. */
function valueOf(point: ProgressionPoint): number | null {
  switch (activeMetric.value) {
    case 'maxWeight':
      return point.maxWeightKg;
    case 'est1RM':
      return point.est1RM;
    case 'volume':
      return point.volumeKg;
    case 'totalReps':
      return point.totalReps;
    case 'distance':
      return point.distanceKm;
    case 'duration':
      return point.durationSeconds;
    case 'pace':
      // Pace is derived: minutes per kilometre, so it needs both operands.
      return point.distanceKm && point.durationSeconds
        ? point.durationSeconds / 60 / point.distanceKm
        : null;
  }
}

function render(value: number | null): string {
  if (value === null) {
    return EMPTY;
  }
  switch (activeMetric.value) {
    case 'volume':
      return formatVolume(value);
    case 'totalReps':
      return `${formatInteger(value)} reps`;
    case 'distance':
      return formatDistanceKm(value);
    case 'duration':
      return formatDuration(value);
    case 'pace':
      return formatPace(value);
    default:
      return `${formatWeight(value)} kg`;
  }
}

const filtered = computed(() => {
  const found = RANGES.find((item) => item.value === range.value);
  if (!found?.days) {
    return props.points;
  }
  const cutoff = Date.now() - found.days * 86_400_000;
  return props.points.filter((point) => Date.parse(point.date) >= cutoff);
});

const values = computed(() => filtered.value.map(valueOf));
// progression.date is a date-only value; formatDate would append "00:00".
const labels = computed(() => filtered.value.map((point) => formatDay(point.date)));
const trend = computed(() => (showTrend.value ? linearTrend(values.value) : null));

const hasData = computed(() => values.value.some((value) => value !== null));

const color = computed(() =>
  activeMetric.value === 'volume' ? METRIC_COLORS.volume : METRIC_COLORS.sets,
);

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    formatter: (params: unknown) => {
      const entries = params as Array<{ dataIndex: number }>;
      const index = entries[0]?.dataIndex ?? 0;
      const point = filtered.value[index];
      if (!point) {
        return '';
      }
      const lines = [`<strong>${labels.value[index] ?? ''}</strong>`, render(values.value[index] ?? null)];
      if (point.isPR) {
        lines.push('<span style="color:#16a34a">Personal record</span>');
      }
      return lines.join('<br/>');
    },
  },
  grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
  xAxis: { ...categoryAxis(palette), data: labels.value },
  yAxis: { ...valueAxis(palette), scale: true },
  series: [
    {
      name: 'Session',
      type: 'line',
      connectNulls: true,
      lineStyle: { color: color.value, width: 2 },
      itemStyle: { color: color.value },
      // PR sessions get a larger diamond so they read at a glance.
      symbol: (_value: unknown, params: { dataIndex: number }) =>
        filtered.value[params.dataIndex]?.isPR ? 'diamond' : 'circle',
      symbolSize: (_value: unknown, params: { dataIndex: number }) =>
        filtered.value[params.dataIndex]?.isPR ? 11 : 5,
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
    title="Progression"
    :subtitle="`${metrics.find((item) => item.value === activeMetric)?.label ?? ''} per session`"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    empty-label="No sessions in this range."
    :height="360"
    :aria-label="`Progression chart, ${filtered.length} sessions`"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <div class="flex flex-wrap items-center gap-2">
        <MetricSwitcher
          :options="metrics"
          :model-value="activeMetric"
          label="Progression metric"
          @update:model-value="metric = $event as Metric"
        />
        <MetricSwitcher
          :options="RANGES"
          :model-value="range"
          label="Date range"
          @update:model-value="range = $event"
        />
        <label class="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input v-model="showTrend" type="checkbox" />
          Trendline
        </label>
      </div>
    </template>

    <BaseChart :option="option" />

    <template #fallback>
      <table>
        <caption>Progression per session</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
            <th scope="col">Record</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(point, index) in filtered" :key="point.workoutId">
            <th scope="row">{{ labels[index] }}</th>
            <td>{{ render(values[index] ?? null) }}</td>
            <td>{{ point.isPR ? 'Personal record' : '' }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ChartCard>
</template>
