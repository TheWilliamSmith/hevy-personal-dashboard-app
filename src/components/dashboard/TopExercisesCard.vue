<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';

import BaseChart from './BaseChart.vue';
import ChartCard from './ChartCard.vue';
import MetricSwitcher from './MetricSwitcher.vue';
import type { ExerciseSortBy, ExerciseStats } from '@/types/stats';
import { baseOption, formatAxisValue, METRIC_COLORS, resolveTheme, valueAxis } from '@/charts/theme';
import { formatInteger, formatVolume } from '@/utils/format';

const props = defineProps<{
  exercises: ExerciseStats[] | null;
  sortBy: ExerciseSortBy;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: []; sortBy: [value: ExerciseSortBy] }>();

const SORTS: ReadonlyArray<{ value: ExerciseSortBy; label: string }> = [
  { value: 'volume', label: 'Volume' },
  { value: 'sets', label: 'Sets' },
  { value: 'sessions', label: 'Sessions' },
];

const palette = resolveTheme();

/** Sort key doubles as the metric, so the bar keeps that metric's hue. */
const metricColor = computed(() =>
  props.sortBy === 'volume' ? METRIC_COLORS.volume : props.sortBy === 'sets' ? METRIC_COLORS.sets : METRIC_COLORS.reps,
);

const rows = computed(() => props.exercises ?? []);
const hasData = computed(() => rows.value.length > 0);

function valueOf(stat: ExerciseStats): number {
  switch (props.sortBy) {
    case 'volume':
      return stat.totalVolumeKg;
    case 'sets':
      return stat.sets;
    case 'sessions':
      return stat.sessions;
  }
}

function renderValue(stat: ExerciseStats): string {
  return props.sortBy === 'volume' ? formatVolume(stat.totalVolumeKg) : formatInteger(valueOf(stat));
}

// ECharts draws a category axis bottom-up; reverse so the top rank sits on top.
const ordered = computed(() => [...rows.value].reverse());

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: unknown) => {
      const entries = params as Array<{ dataIndex: number }>;
      const stat = ordered.value[entries[0]?.dataIndex ?? 0];
      return stat
        ? `<strong>${stat.name}</strong><br/>Volume: ${formatVolume(stat.totalVolumeKg)}<br/>Sets: ${formatInteger(stat.sets)}<br/>Sessions: ${formatInteger(stat.sessions)}`
        : '';
    },
  },
  grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
  xAxis: {
    ...valueAxis(palette),
    axisLabel: {
      color: palette.axisLabel,
      formatter: (value: number) => formatAxisValue(props.sortBy === 'volume' ? 'volume' : 'sets', value),
    },
  },
  yAxis: {
    type: 'category',
    data: ordered.value.map((stat) => stat.name),
    axisLine: { lineStyle: { color: palette.axis } },
    axisTick: { show: false },
    axisLabel: { color: palette.axisLabel, width: 150, overflow: 'truncate' },
  },
  series: [
    {
      type: 'bar',
      itemStyle: { color: metricColor.value, borderRadius: [0, 3, 3, 0] },
      barMaxWidth: 14,
      data: ordered.value.map((stat) => valueOf(stat)),
    },
  ],
}));
</script>

<template>
  <ChartCard
    title="Top exercises"
    :subtitle="`Top ${rows.length} by ${props.sortBy}`"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    :height="420"
    :aria-label="`Top exercises ranked by ${props.sortBy}`"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <MetricSwitcher
        :options="SORTS"
        :model-value="props.sortBy"
        label="Rank exercises by"
        @update:model-value="emit('sortBy', $event as ExerciseSortBy)"
      />
    </template>

    <BaseChart :option="option" />

    <template #fallback>
      <table>
        <caption>Top exercises by {{ props.sortBy }}</caption>
        <thead>
          <tr>
            <th scope="col">Exercise</th>
            <th scope="col">{{ props.sortBy }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in rows" :key="stat.name">
            <th scope="row">{{ stat.name }}</th>
            <td>{{ renderValue(stat) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ChartCard>
</template>
