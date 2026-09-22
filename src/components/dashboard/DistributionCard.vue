<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';

import BaseChart from './BaseChart.vue';
import ChartCard from './ChartCard.vue';
import type { DistributionBucket } from '@/types/stats';
import { baseOption, formatAxisValue, METRIC_COLORS, resolveTheme, valueAxis } from '@/charts/theme';
import { formatInteger, formatVolume } from '@/utils/format';

const props = defineProps<{
  title: string;
  subtitle: string;
  buckets: DistributionBucket[] | null;
  /** 'bar' for weekday, 'donut' for rep range — the only donut in the app. */
  variant: 'bar' | 'donut';
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const palette = resolveTheme();

const rows = computed(() => props.buckets ?? []);
const hasData = computed(() => rows.value.some((row) => row.sets > 0 || row.workouts > 0));

function tooltipFor(row: DistributionBucket): string {
  return [
    `<strong>${row.key}</strong>`,
    `Volume: ${formatVolume(row.volumeKg)}`,
    `Sets: ${formatInteger(row.sets)}`,
    `Share: ${row.percentage} %`,
  ].join('<br/>');
}

const barOption = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: unknown) => {
      const entries = params as Array<{ dataIndex: number }>;
      const row = rows.value[entries[0]?.dataIndex ?? 0];
      return row ? tooltipFor(row) : '';
    },
  },
  grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
  // Horizontal bars: value on x, category on y.
  xAxis: {
    ...valueAxis(palette),
    axisLabel: {
      color: palette.axisLabel,
      formatter: (value: number) => formatAxisValue('volume', value),
    },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: rows.value.map((row) => row.key),
    axisLine: { lineStyle: { color: palette.axis } },
    axisTick: { show: false },
    axisLabel: { color: palette.axisLabel },
  },
  series: [
    {
      type: 'bar',
      itemStyle: { color: METRIC_COLORS.volume, borderRadius: [0, 3, 3, 0] },
      barMaxWidth: 16,
      data: rows.value.map((row) => row.volumeKg),
    },
  ],
}));

const donutOption = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'item',
    formatter: (params: unknown) => {
      const entry = params as { dataIndex: number };
      const row = rows.value[entry.dataIndex];
      return row ? tooltipFor(row) : '';
    },
  },
  legend: {
    orient: 'vertical',
    right: 0,
    top: 'center',
    textStyle: { color: palette.mutedText, fontSize: 11 },
  },
  series: [
    {
      type: 'pie',
      radius: ['52%', '78%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
      data: rows.value.map((row, index) => ({
        name: row.key,
        value: row.sets,
        itemStyle: { color: palette.categorical[index % palette.categorical.length] },
      })),
    },
  ],
}));

const option = computed(() => (props.variant === 'donut' ? donutOption.value : barOption.value));
</script>

<template>
  <ChartCard
    :title="props.title"
    :subtitle="props.subtitle"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    :height="200"
    :aria-label="`${props.title}: ${props.subtitle}`"
    @retry="emit('retry')"
  >
    <BaseChart :option="option" />

    <template #fallback>
      <table>
        <caption>{{ props.title }}</caption>
        <thead>
          <tr>
            <th scope="col">Bucket</th>
            <th scope="col">Volume</th>
            <th scope="col">Sets</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <th scope="row">{{ row.key }}</th>
            <td>{{ formatVolume(row.volumeKg) }}</td>
            <td>{{ formatInteger(row.sets) }}</td>
            <td>{{ row.percentage }} %</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ChartCard>
</template>
