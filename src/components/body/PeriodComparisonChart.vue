<script setup lang="ts">
import { t } from '@/i18n';
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';

import BaseChart from '@/components/dashboard/BaseChart.vue';
import { baseOption, chartPalette } from '@/charts/theme';
import { MUSCLE_LABELS } from '@/constants/muscles';
import type { MuscleGroup, MuscleHeatmap } from '@/types/stats';

const props = defineProps<{
  heatmap: MuscleHeatmap;
  muscles: readonly MuscleGroup[];
  format: (value: number) => string;
}>();

const CURRENT_COLOR = '#3b82f6';
const PREVIOUS_COLOR = '#52525b';

const palette = computed(chartPalette);

const rows = computed(() => [...props.muscles].reverse());

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette.value),
  grid: { left: 4, right: 12, top: 8, bottom: 4, containLabel: true },
  tooltip: {
    ...baseOption(palette.value).tooltip,
    trigger: 'axis',
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
    formatter: (params: unknown) => {
      const index = (params as Array<{ dataIndex: number }>)[0]?.dataIndex ?? 0;
      const muscle = rows.value[index];
      if (!muscle) {
        return '';
      }
      return [
        `<strong>${MUSCLE_LABELS[muscle]}</strong>`,
        t('body.thisPeriodValue', { value: props.format(props.heatmap.values[muscle]) }),
        t('body.previousValue', { value: props.format(props.heatmap.previous[muscle]) }),
      ].join('<br/>');
    },
  },
  xAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: palette.value.axisLabel, formatter: (value: number) => props.format(value) },
    splitLine: { lineStyle: { color: palette.value.splitLine } },
  },
  yAxis: {
    type: 'category',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: palette.value.axisLabel },
    data: rows.value.map((muscle) => MUSCLE_LABELS[muscle]),
  },
  series: [
    {
      name: t('body.previousPeriod'),
      type: 'bar',
      barGap: '20%',
      barMaxWidth: 8,
      itemStyle: { color: PREVIOUS_COLOR, borderRadius: 4 },
      data: rows.value.map((muscle) => props.heatmap.previous[muscle]),
    },
    {
      name: t('body.thisPeriod'),
      type: 'bar',
      barMaxWidth: 8,
      itemStyle: { color: CURRENT_COLOR, borderRadius: 4 },
      data: rows.value.map((muscle) => props.heatmap.values[muscle]),
    },
  ],
}));
</script>

<template>
  <div class="flex h-full flex-col gap-3">
    <div class="flex items-center gap-4 text-xs text-zinc-400" aria-hidden="true">
      <span class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-[3px] bg-blue-500" />
        {{ t('body.thisPeriod') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-[3px] bg-zinc-600" />
        {{ t('body.previousPeriod') }}
      </span>
    </div>
    <div class="relative min-h-0 flex-1">
      <BaseChart :option="option" :aria-label="t('body.comparisonLabel', { count: muscles.length })" />
    </div>
  </div>
</template>
