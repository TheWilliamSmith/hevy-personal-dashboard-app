<script setup lang="ts">
import { computed } from 'vue';

import GoalsCard from '@/components/goals/GoalsCard.vue';
import KeyMetrics from '@/components/home/KeyMetrics.vue';
import MuscleFocusCard from '@/components/home/MuscleFocusCard.vue';
import RangeSwitch from '@/components/ui/RangeSwitch.vue';
import TrainingCalendar from '@/components/home/TrainingCalendar.vue';
import TrophySpotlight from '@/components/home/TrophySpotlight.vue';
import VolumeTrendCard from '@/components/home/VolumeTrendCard.vue';
import {
  useDashboardFilters,
  useMuscleHeatmap,
  useStatsOverview,
  useStatsTimeseries,
} from '@/composables/stats';
import { RANGE_PRESETS, type RangePreset } from '@/composables/stats/useDashboardFilters';
import { useGoals } from '@/composables/useGoals';
import { useStatsResource } from '@/composables/stats/useStatsResource';
import { apiGet } from '@/lib/api';
import type { AchievementsSummary } from '@/types/achievements';
import type { CalendarDay, Granularity, StatsRange } from '@/types/stats';
import { buildCalendarGrid, rollingSum, yearsBetween } from '@/utils/calendar';

const CALENDAR_WEEKS = 36;
const ROLLING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const GRANULARITY_BY_PRESET: Readonly<Record<RangePreset, Granularity>> = {
  '30d': 'day',
  '3m': 'day',
  '6m': 'week',
  '1y': 'month',
  all: 'month',
  custom: 'week',
};

const filters = useDashboardFilters();

const preset = computed<RangePreset>(() =>
  filters.preset.value === 'custom' ? '30d' : filters.preset.value,
);
const granularity = computed(() => GRANULARITY_BY_PRESET[preset.value]);

const rangeLabel = computed(() => {
  const found = RANGE_PRESETS.find((candidate) => candidate.value === preset.value);
  return found?.days ? `Last ${found.label}` : 'All time';
});

const calendarYears = computed(() => {
  const grid = buildCalendarGrid(new Date(), CALENDAR_WEEKS, new Map());
  return yearsBetween(grid.from, grid.to);
});

const overview = useStatsOverview(() => filters.range.value);
const isRolling = computed(() => granularity.value === 'day' && filters.range.value.from !== undefined);

const volumeRange = computed<StatsRange>(() => {
  const range = filters.range.value;
  if (!isRolling.value || !range.from) {
    return range;
  }
  const from = new Date(new Date(range.from).getTime() - (ROLLING_DAYS - 1) * DAY_MS);
  return { ...range, from: from.toISOString() };
});

const volume = useStatsTimeseries(
  () => volumeRange.value,
  () => 'volume',
  () => granularity.value,
);

const volumePoints = computed(() => {
  const points = volume.data.value;
  if (!points || !isRolling.value) {
    return points;
  }
  return rollingSum(points, ROLLING_DAYS);
});

const volumeCaption = computed(() =>
  isRolling.value
    ? `Rolling ${ROLLING_DAYS}-day volume · ${rangeLabel.value}`
    : `Volume per ${granularity.value} · ${rangeLabel.value}`,
);
const muscles = useMuscleHeatmap(
  () => filters.range.value,
  () => 'sets',
  () => false,
);
const calendar = useStatsResource(
  async (signal) => {
    const years = await Promise.all(
      calendarYears.value.map((year) => apiGet<CalendarDay[]>('/stats/calendar', { year }, signal)),
    );
    return years.flat();
  },
  () => calendarYears.value,
);
const goals = useGoals();
const trophies = useStatsResource(
  (signal) => apiGet<AchievementsSummary>('/achievements/summary', {}, signal),
  () => null,
);
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <Teleport to="#topbar-actions" defer>
      <RangeSwitch :model-value="preset" @update:model-value="filters.setPreset" />
    </Teleport>

    <div class="flex flex-col gap-10 pt-6">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <TrainingCalendar
          class="lg:pr-8"
          :week-count="CALENDAR_WEEKS"
          :days="calendar.data.value"
          :is-loading="calendar.isLoading.value"
          :error="calendar.error.value"
          @retry="calendar.refresh"
        />
        <TrophySpotlight
          class="border-zinc-800 lg:border-l lg:pl-8"
          :summary="trophies.data.value"
          :is-loading="trophies.isLoading.value"
          :error="trophies.error.value"
          @retry="trophies.refresh"
        />
      </div>

      <GoalsCard
        :goals="goals.active.value"
        :is-loading="goals.isLoading.value"
        :error="goals.error.value"
        @retry="goals.load"
      />

      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-0">
        <MuscleFocusCard
          class="lg:pr-8"
          :heatmap="muscles.data.value"
          :range-label="rangeLabel"
          :is-loading="muscles.isLoading.value"
          :error="muscles.error.value"
          @retry="muscles.refresh"
        />
        <VolumeTrendCard
          class="border-zinc-800 lg:border-l lg:pl-8"
          :points="volumePoints"
          :granularity="granularity"
          :total-volume-kg="overview.data.value?.totalVolumeKg ?? null"
          :caption="volumeCaption"
          :is-loading="volume.isLoading.value"
          :error="volume.error.value"
          @retry="volume.refresh"
        />
      </div>

      <KeyMetrics
        :overview="overview.data.value"
        :range-label="rangeLabel"
        :is-loading="overview.isLoading.value"
        :error="overview.error.value"
        @retry="overview.refresh"
      />
    </div>
  </div>
</template>
