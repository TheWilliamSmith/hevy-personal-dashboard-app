<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';

import BaseChart from '@/components/dashboard/BaseChart.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { baseOption, categoryAxis, formatAxisValue, resolveTheme, valueAxis } from '@/charts/theme';
import type { Granularity, TimeseriesPoint } from '@/types/stats';
import { formatBucket, formatInteger, formatVolume } from '@/utils/format';

const props = defineProps<{
  points: TimeseriesPoint[] | null;
  granularity: Granularity;
  totalVolumeKg: number | null;
  caption: string;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const LINE_COLOR = '#3b82f6';

const palette = { ...resolveTheme(true), splitLine: '#27272a', tooltipBackground: '#18181b', tooltipBorder: '#3f3f46' };

const rows = computed(() => props.points ?? []);
const labels = computed(() => rows.value.map((point) => formatBucket(point.bucket, props.granularity)));
const hasData = computed(() => rows.value.some((point) => point.value > 0));

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    formatter: (params: unknown) => {
      const index = (params as Array<{ dataIndex: number }>)[0]?.dataIndex ?? 0;
      const point = rows.value[index];
      if (!point) {
        return '';
      }
      return [
        `<strong>${labels.value[index] ?? ''}</strong>`,
        `Volume: ${formatVolume(point.value)}`,
        `Workouts: ${formatInteger(point.workoutCount)}`,
      ].join('<br/>');
    },
  },
  xAxis: {
    ...categoryAxis(palette),
    boundaryGap: false,
    axisLine: { show: false },
    data: labels.value,
  },
  yAxis: {
    ...valueAxis(palette),
    splitLine: { lineStyle: { color: palette.splitLine } },
    axisLabel: { color: palette.axisLabel, formatter: (value: number) => formatAxisValue('volume', value) },
  },
  series: [
    {
      name: 'Volume',
      type: 'line',
      symbol: 'none',
      lineStyle: { color: LINE_COLOR, width: 2 },
      itemStyle: { color: LINE_COLOR },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' },
          ],
        },
      },
      data: rows.value.map((point) => point.value),
    },
  ],
}));
</script>

<template>
  <section class="flex flex-col gap-4">
    <SectionHeader title="Training volume" :subtitle="caption">
      <p class="text-right">
        <span class="text-2xl font-semibold text-white tabular-nums">{{ formatVolume(totalVolumeKg) }}</span>
        <span class="block text-[11px] leading-tight text-zinc-500">Total volume</span>
      </p>
    </SectionHeader>

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <div v-else class="relative h-64">
      <div v-if="isLoading && !points" class="absolute inset-0 animate-pulse rounded-md bg-zinc-900" />
      <p v-else-if="!hasData" class="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
        No volume in this period.
      </p>
      <BaseChart v-else :option="option" :aria-label="caption" />
    </div>
  </section>
</template>
