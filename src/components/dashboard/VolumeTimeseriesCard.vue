<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';

import BaseChart from './BaseChart.vue';
import ChartCard from './ChartCard.vue';
import MetricSwitcher from './MetricSwitcher.vue';
import type { Granularity, TimeseriesMetric, TimeseriesPoint } from '@/types/stats';
import {
  baseOption,
  categoryAxis,
  formatAxisValue,
  formatMetric,
  METRIC_COLORS,
  METRIC_LABELS,
  resolveTheme,
  valueAxis,
  WORKOUT_COUNT_COLOR,
} from '@/charts/theme';
import { formatBucket, formatInteger } from '@/utils/format';

const props = defineProps<{
  points: TimeseriesPoint[] | null;
  metric: TimeseriesMetric;
  granularity: Granularity;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: []; metric: [value: TimeseriesMetric] }>();

/** "workouts" is left out: the count already rides the secondary axis. */
const METRICS: ReadonlyArray<{ value: TimeseriesMetric; label: string }> = [
  { value: 'volume', label: 'Volume' },
  { value: 'sets', label: 'Sets' },
  { value: 'reps', label: 'Reps' },
  { value: 'duration', label: 'Duration' },
];

const palette = resolveTheme();

const rows = computed(() => props.points ?? []);
const hasData = computed(() => rows.value.some((point) => point.value > 0 || point.workoutCount > 0));

const labels = computed(() =>
  rows.value.map((point) => formatBucket(point.bucket, props.granularity)),
);

/** The one deliberate dual-axis chart: metric as bars, workout count as line. */
const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: unknown) => {
      const entries = params as Array<{ dataIndex: number }>;
      const index = entries[0]?.dataIndex ?? 0;
      const point = rows.value[index];
      if (!point) {
        return '';
      }
      return [
        `<strong>${labels.value[index] ?? ''}</strong>`,
        `${METRIC_LABELS[props.metric]}: ${formatMetric(props.metric, point.value)}`,
        `Workouts: ${formatInteger(point.workoutCount)}`,
      ].join('<br/>');
    },
  },
  legend: { show: true, top: 0, left: 'center', textStyle: { color: palette.mutedText } },
  grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
  xAxis: { ...categoryAxis(palette), data: labels.value },
  yAxis: [
    {
      ...valueAxis(palette, METRIC_LABELS[props.metric]),
      axisLabel: {
        color: palette.axisLabel,
        formatter: (value: number) => formatAxisValue(props.metric, value),
      },
    },
    {
      // No axis name: it collided with the legend in the top-right corner.
      ...valueAxis(palette),
      splitLine: { show: false },
      // A count is a whole number. Without minInterval ECharts splits a max of
      // 1 into 0.2 steps and every tick rounds to the same label ("1,1,1,0,0").
      minInterval: 1,
      axisLabel: { color: palette.axisLabel, formatter: (value: number) => formatInteger(value) },
    },
  ],
  series: [
    {
      name: METRIC_LABELS[props.metric],
      type: 'bar',
      yAxisIndex: 0,
      itemStyle: { color: METRIC_COLORS[props.metric], borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 28,
      data: rows.value.map((point) => point.value),
    },
    {
      name: 'Workouts',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: WORKOUT_COUNT_COLOR, width: 2 },
      itemStyle: { color: WORKOUT_COUNT_COLOR },
      data: rows.value.map((point) => point.workoutCount),
    },
  ],
}));
</script>

<template>
  <ChartCard
    title="Training over time"
    :subtitle="`${METRIC_LABELS[props.metric]} per ${props.granularity}, with workout count`"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    :height="320"
    :aria-label="`${METRIC_LABELS[props.metric]} per ${props.granularity} with workout count, ${rows.length} buckets`"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <MetricSwitcher
        :options="METRICS"
        :model-value="props.metric"
        label="Chart metric"
        @update:model-value="emit('metric', $event as TimeseriesMetric)"
      />
    </template>

    <BaseChart :option="option" />

    <template #fallback>
      <table>
        <caption>{{ METRIC_LABELS[props.metric] }} and workout count per {{ props.granularity }}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">{{ METRIC_LABELS[props.metric] }}</th>
            <th scope="col">Workouts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(point, index) in rows" :key="point.bucket">
            <th scope="row">{{ labels[index] }}</th>
            <td>{{ formatMetric(props.metric, point.value) }}</td>
            <td>{{ formatInteger(point.workoutCount) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ChartCard>
</template>
