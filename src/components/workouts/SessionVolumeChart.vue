<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';

import BaseChart from '@/components/dashboard/BaseChart.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { baseOption, categoryAxis, formatAxisValue, resolveTheme, valueAxis } from '@/charts/theme';
import type { WorkoutSummary } from '@/types/workouts';
import { formatBucket, formatDuration, formatVolume } from '@/utils/format';

const props = defineProps<{
  workouts: WorkoutSummary[];
  isLoading: boolean;
}>();

const emit = defineEmits<{ open: [id: string] }>();

const BAR_COLOR = '#3b82f6';

const palette = { ...resolveTheme(true), splitLine: '#27272a', tooltipBackground: '#18181b', tooltipBorder: '#3f3f46' };

const sessions = computed(() => [...props.workouts].reverse());

const average = computed(() =>
  sessions.value.length === 0
    ? null
    : sessions.value.reduce((sum, workout) => sum + workout.totalVolumeKg, 0) / sessions.value.length,
);

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'axis',
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
    formatter: (params: unknown) => {
      const index = (params as Array<{ dataIndex: number }>)[0]?.dataIndex ?? 0;
      const workout = sessions.value[index];
      if (!workout) {
        return '';
      }
      return [
        `<strong>${workout.title}</strong>`,
        formatBucket(workout.startedAt, 'day'),
        `Volume: ${formatVolume(workout.totalVolumeKg)}`,
        `Duration: ${formatDuration(workout.durationSec)}`,
      ].join('<br/>');
    },
  },
  xAxis: {
    ...categoryAxis(palette),
    axisLine: { show: false },
    data: sessions.value.map((workout) => formatBucket(workout.startedAt, 'day')),
  },
  yAxis: {
    ...valueAxis(palette),
    splitLine: { lineStyle: { color: palette.splitLine } },
    axisLabel: { color: palette.axisLabel, formatter: (value: number) => formatAxisValue('volume', value) },
  },
  series: [
    {
      name: 'Volume',
      type: 'bar',
      barMaxWidth: 18,
      cursor: 'pointer',
      itemStyle: { color: BAR_COLOR, borderRadius: [4, 4, 0, 0] },
      emphasis: { itemStyle: { color: '#60a5fa' } },
      data: sessions.value.map((workout) => workout.totalVolumeKg),
    },
  ],
}));

function onSelect(index: number): void {
  const workout = sessions.value[index];
  if (workout) {
    emit('open', workout.id);
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <SectionHeader title="Volume per session" subtitle="Workouts listed below · click a bar to open it">
      <p class="text-right">
        <span class="text-2xl font-semibold text-white tabular-nums">{{ formatVolume(average) }}</span>
        <span class="block text-[11px] leading-tight text-zinc-500">Average volume</span>
      </p>
    </SectionHeader>

    <div class="relative h-64">
      <div v-if="isLoading && workouts.length === 0" class="absolute inset-0 animate-pulse rounded-md bg-zinc-900" />
      <p v-else-if="workouts.length === 0" class="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
        No workout to chart.
      </p>
      <BaseChart
        v-else
        :option="option"
        :aria-label="`Volume of the ${workouts.length} workouts listed below`"
        @select="onSelect"
      />
    </div>
  </section>
</template>
