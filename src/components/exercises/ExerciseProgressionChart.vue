<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { computed, ref } from 'vue';

import BaseChart from '@/components/dashboard/BaseChart.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { baseOption, categoryAxis, resolveTheme, valueAxis } from '@/charts/theme';
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

const props = defineProps<{ points: ProgressionPoint[]; kind: ExerciseKind }>();

type Metric = 'maxWeight' | 'est1RM' | 'volume' | 'totalReps' | 'distance' | 'duration' | 'pace';
type Range = '3m' | '6m' | '1y' | 'all';

const STRENGTH_METRICS: ReadonlyArray<SegmentedOption<Metric>> = [
  { value: 'maxWeight', label: 'Max weight', shortLabel: 'Max' },
  { value: 'est1RM', label: 'Est. 1RM', shortLabel: '1RM' },
  { value: 'volume', label: 'Volume', shortLabel: 'Vol' },
  { value: 'totalReps', label: 'Reps' },
];

const CARDIO_METRICS: ReadonlyArray<SegmentedOption<Metric>> = [
  { value: 'distance', label: 'Distance' },
  { value: 'duration', label: 'Duration' },
  { value: 'pace', label: 'Pace' },
];

const RANGES: ReadonlyArray<SegmentedOption<Range>> = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

const RANGE_DAYS: Readonly<Record<Range, number | null>> = { '3m': 90, '6m': 180, '1y': 365, all: null };

const LINE_COLOR = '#3b82f6';
const PR_COLOR = '#34d399';

const palette = { ...resolveTheme(true), splitLine: '#27272a', tooltipBackground: '#18181b', tooltipBorder: '#3f3f46' };

const metrics = computed(() => (props.kind === 'CARDIO' ? CARDIO_METRICS : STRENGTH_METRICS));

const metric = ref<Metric>('est1RM');
const range = ref<Range>('all');
const showTrend = ref(false);

const activeMetric = computed<Metric>(() => {
  const allowed = metrics.value.map((item) => item.value);
  return allowed.includes(metric.value) ? metric.value : (allowed[0] ?? 'est1RM');
});

const metricLabel = computed(() => metrics.value.find((item) => item.value === activeMetric.value)?.label ?? '');

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
      return point.distanceKm && point.durationSeconds ? point.durationSeconds / 60 / point.distanceKm : null;
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
  const days = RANGE_DAYS[range.value];
  if (!days) {
    return props.points;
  }
  const cutoff = Date.now() - days * 86_400_000;
  return props.points.filter((point) => Date.parse(point.date) >= cutoff);
});

const values = computed(() => filtered.value.map(valueOf));
const labels = computed(() => filtered.value.map((point) => formatDay(point.date)));
const trend = computed(() => (showTrend.value ? linearTrend(values.value) : null));
const hasData = computed(() => values.value.some((value) => value !== null));

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    formatter: (params: unknown) => {
      const index = (params as Array<{ dataIndex: number }>)[0]?.dataIndex ?? 0;
      const point = filtered.value[index];
      if (!point) {
        return '';
      }
      const lines = [`<strong>${labels.value[index] ?? ''}</strong>`, render(values.value[index] ?? null)];
      if (point.isPR) {
        lines.push(`<span style="color:${PR_COLOR}">Personal record</span>`);
      }
      return lines.join('<br/>');
    },
  },
  xAxis: { ...categoryAxis(palette), axisLine: { show: false }, data: labels.value },
  yAxis: { ...valueAxis(palette), scale: true, splitLine: { lineStyle: { color: palette.splitLine } } },
  series: [
    {
      name: metricLabel.value,
      type: 'line',
      connectNulls: true,
      lineStyle: { color: LINE_COLOR, width: 2 },
      itemStyle: {
        color: (params: { dataIndex: number }) => (filtered.value[params.dataIndex]?.isPR ? PR_COLOR : LINE_COLOR),
      },
      symbol: (_value: unknown, params: { dataIndex: number }) =>
        filtered.value[params.dataIndex]?.isPR ? 'diamond' : 'circle',
      symbolSize: (_value: unknown, params: { dataIndex: number }) =>
        filtered.value[params.dataIndex]?.isPR ? 10 : 4,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' },
          ],
        },
      },
      data: values.value,
    },
    ...(trend.value
      ? [
          {
            name: 'Trend',
            type: 'line' as const,
            symbol: 'none' as const,
            lineStyle: { color: '#a1a1aa', width: 1.5, type: 'dashed' as const },
            data: trend.value.points,
          },
        ]
      : []),
  ],
}));
</script>

<template>
  <section class="flex flex-col gap-4">
    <SectionHeader title="Progression" :subtitle="`${metricLabel} per session · personal records in green`">
      <SegmentedControl v-model="metric" :options="metrics" label="Progression metric" />
    </SectionHeader>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <SegmentedControl v-model="range" :options="RANGES" label="Date range" />
      <label class="flex items-center gap-2 text-xs text-zinc-400">
        <input v-model="showTrend" type="checkbox" class="h-3.5 w-3.5 accent-blue-600" />
        Trendline
      </label>
    </div>

    <div class="relative h-72">
      <p v-if="!hasData" class="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
        No sessions in this range.
      </p>
      <BaseChart v-else :option="option" :aria-label="`${metricLabel} over ${filtered.length} sessions`" />
    </div>
  </section>
</template>
