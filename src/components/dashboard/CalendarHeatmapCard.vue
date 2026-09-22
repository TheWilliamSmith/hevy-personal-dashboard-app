<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';

import BaseChart from './BaseChart.vue';
import ChartCard from './ChartCard.vue';
import type { CalendarDay } from '@/types/stats';
import { baseOption, resolveTheme } from '@/charts/theme';
import { formatDuration, formatVolume } from '@/utils/format';

const props = defineProps<{
  days: CalendarDay[] | null;
  year: number;
  /** Derived from the overview's first/last workout — the API sends no list. */
  availableYears: number[];
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: []; year: [value: number] }>();

const palette = resolveTheme();

// The API omits days without activity, so every returned day counts.
const days = computed(() => props.days ?? []);
const year = computed(() => props.year);
const years = computed(() => props.availableYears);
const hasData = computed(() => days.value.length > 0);

const maxVolume = computed(() =>
  days.value.reduce((highest, day) => Math.max(highest, day.volumeKg), 0),
);

/** ECharts' calendar coordinate system keys on YYYY-MM-DD, as the API sends. */
const cells = computed<Array<[string, number]>>(() =>
  days.value.map((day) => [day.date, day.volumeKg]),
);

const byDate = computed(() => new Map(days.value.map((day) => [day.date, day])));

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette),
  tooltip: {
    ...baseOption(palette).tooltip,
    trigger: 'item',
    formatter: (params: unknown) => {
      const entry = params as { value: [string, number] };
      const day = byDate.value.get(entry.value[0]);
      if (!day) {
        return '';
      }
      return [
        `<strong>${day.date}</strong>`,
        `Volume: ${formatVolume(day.volumeKg)}`,
        `Duration: ${formatDuration(day.durationSec)}`,
        `Workouts: ${day.workouts}`,
      ].join('<br/>');
    },
  },
  visualMap: {
    show: false,
    min: 0,
    max: maxVolume.value || 1,
    inRange: { color: palette.heatmap },
  },
  calendar: {
    top: 28,
    left: 44,
    right: 8,
    cellSize: ['auto', 14],
    range: String(year.value),
    itemStyle: { color: palette.tooltipBackground, borderColor: palette.splitLine, borderWidth: 1 },
    splitLine: { show: false },
    yearLabel: { show: false },
    monthLabel: { color: palette.axisLabel, fontSize: 11 },
    dayLabel: { color: palette.axisLabel, fontSize: 10, firstDay: 1 },
  },
  series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: cells.value }],
}));
</script>

<template>
  <ChartCard
    title="Training calendar"
    subtitle="Daily volume"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    :height="200"
    :aria-label="`Daily training volume for ${year}`"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <label class="sr-only" for="calendar-year">Year</label>
      <select
        id="calendar-year"
        class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
        :value="year"
        @change="emit('year', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="option in years" :key="option" :value="option">{{ option }}</option>
      </select>
    </template>

    <BaseChart :option="option" />

    <template #fallback>
      <table>
        <caption>Daily training volume for {{ year }}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Volume</th>
            <th scope="col">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in days" :key="day.date">
            <th scope="row">{{ day.date }}</th>
            <td>{{ formatVolume(day.volumeKg) }}</td>
            <td>{{ formatDuration(day.durationSec) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </ChartCard>
</template>
