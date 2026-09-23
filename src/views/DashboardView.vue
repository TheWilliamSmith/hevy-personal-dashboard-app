<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import CalendarHeatmapCard from '@/components/dashboard/CalendarHeatmapCard.vue';
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.vue';
import DistributionCard from '@/components/dashboard/DistributionCard.vue';
import ExerciseProgressionCard from '@/components/dashboard/ExerciseProgressionCard.vue';
import KpiTile from '@/components/dashboard/KpiTile.vue';
import MuscleBalanceCard from '@/components/dashboard/MuscleBalanceCard.vue';
import RecordsTableCard from '@/components/dashboard/RecordsTableCard.vue';
import TopExercisesCard from '@/components/dashboard/TopExercisesCard.vue';
import VolumeTimeseriesCard from '@/components/dashboard/VolumeTimeseriesCard.vue';
import {
  useDashboardFilters,
  useExerciseProgression,
  useStatsCalendar,
  useStatsDistribution,
  useMuscleHeatmap,
  useStatsExercises,
  useStatsOverview,
  useStatsRecords,
  useStatsTimeseries,
} from '@/composables/stats';
import type {
  ExerciseSortBy,
  HeatmapMetric,
  ProgressionMetric,
  TimeseriesMetric,
} from '@/types/stats';
import { formatDuration, formatInteger, formatVolume } from '@/utils/format';

const filters = useDashboardFilters();

const sortBy = ref<ExerciseSortBy>('volume');
const selectedExercise = ref('');
const timeseriesMetric = ref<TimeseriesMetric>('volume');
const progressionMetric = ref<ProgressionMetric>('est1RM');
const heatmapMetric = ref<HeatmapMetric>('sets');
const countSecondary = ref(false);

/**
 * Every resource starts fetching during setup, in the same tick: they run
 * concurrently, never waterfalled. Each watches only the inputs it needs, so
 * changing granularity refetches the timeseries alone and changing the year
 * refetches only the calendar.
 */
const overview = useStatsOverview(() => filters.range.value);
const timeseries = useStatsTimeseries(
  () => filters.range.value,
  () => timeseriesMetric.value,
  () => filters.granularity.value,
);
const exercises = useStatsExercises(
  () => filters.range.value,
  () => sortBy.value,
);
const weekday = useStatsDistribution(
  () => filters.range.value,
  () => 'weekday',
);
const repRange = useStatsDistribution(
  () => filters.range.value,
  () => 'repRange',
);
const calendar = useStatsCalendar(() => filters.year.value);
const records = useStatsRecords();
const heatmap = useMuscleHeatmap(
  () => filters.range.value,
  () => heatmapMetric.value,
  () => countSecondary.value,
);
const progression = useExerciseProgression(
  () => filters.range.value,
  () => selectedExercise.value,
  () => progressionMetric.value,
);

const exerciseNames = computed(() => (exercises.data.value ?? []).map((stat) => stat.name));

// The picker is fed by the ranking, so default to whatever tops it.
watch(exerciseNames, (names) => {
  if (!selectedExercise.value && names.length > 0) {
    selectedExercise.value = names[0] ?? '';
  }
});

const stats = computed(() => overview.data.value);
const previous = computed(() => overview.data.value?.previous ?? null);

/**
 * The API sends no list of years, so the selector is derived from the first and
 * last workout the overview reports.
 */
const availableYears = computed(() => {
  const first = stats.value?.firstWorkoutAt;
  const last = stats.value?.lastWorkoutAt;
  const thisYear = new Date().getUTCFullYear();

  if (!first || !last) {
    return [thisYear];
  }

  const start = new Date(first).getUTCFullYear();
  const end = new Date(last).getUTCFullYear();
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

/** Only a loaded, genuinely empty overview shows the global empty state. */
const isEmptyDashboard = computed(
  () => stats.value !== null && stats.value !== undefined && stats.value.totalWorkouts === 0,
);

/**
 * `previous` carries only four metrics, so total reps and total time have no
 * honest comparison — those tiles pass null and render "No comparison".
 */
const kpis = computed(() => [
  {
    label: 'Workouts',
    value: formatInteger(stats.value?.totalWorkouts ?? null),
    current: stats.value?.totalWorkouts ?? null,
    previous: previous.value?.totalWorkouts ?? null,
  },
  {
    label: 'Total volume',
    value: formatVolume(stats.value?.totalVolumeKg ?? null),
    current: stats.value?.totalVolumeKg ?? null,
    previous: previous.value?.totalVolumeKg ?? null,
  },
  {
    label: 'Total sets',
    value: formatInteger(stats.value?.totalSets ?? null),
    current: stats.value?.totalSets ?? null,
    previous: previous.value?.totalSets ?? null,
  },
  {
    label: 'Total reps',
    value: formatInteger(stats.value?.totalReps ?? null),
    current: stats.value?.totalReps ?? null,
    previous: null,
  },
  {
    label: 'Total time',
    value: formatDuration(stats.value?.totalDurationSec ?? null),
    current: stats.value?.totalDurationSec ?? null,
    previous: null,
  },
  {
    label: 'Avg session',
    value: formatDuration(stats.value?.avgDurationSec ?? null),
    current: stats.value?.avgDurationSec ?? null,
    previous: previous.value?.avgDurationSec ?? null,
  },
]);
</script>

<template>
  <div>
    <DashboardToolbar
      :preset="filters.preset.value"
      :granularity="filters.granularity.value"
      :custom-from="filters.customFrom.value"
      :custom-to="filters.customTo.value"
      @preset="filters.setPreset"
      @custom-range="filters.setCustomRange"
      @granularity="filters.setGranularity"
    />

    <div
      v-if="isEmptyDashboard"
      class="border-y border-dashed border-slate-300 bg-white p-16 text-center"
    >
      <p class="text-slate-700">No workouts yet.</p>
      <RouterLink
        :to="{ name: 'home', query: { tab: 'imports' } }"
        class="mt-3 inline-block text-sm font-medium text-indigo-700 underline underline-offset-2"
      >
        Import your Hevy export
      </RouterLink>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-px border-y border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-12"
    >
      <div class="md:col-span-2 xl:col-span-12">
        <div v-if="overview.error.value" class="bg-red-50 p-4" role="alert">
          <p class="text-sm text-red-900">{{ overview.error.value }}</p>
          <button
            type="button"
            class="mt-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
            @click="overview.refresh"
          >
            Retry
          </button>
        </div>
        <div class="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 xl:grid-cols-6" v-else>
          <KpiTile
            v-for="kpi in kpis"
            :key="kpi.label"
            :label="kpi.label"
            :value="kpi.value"
            :current="kpi.current"
            :previous="kpi.previous"
            :comparison-label="filters.comparisonLabel.value"
            :is-loading="overview.isLoading.value"
          />
        </div>
      </div>

      <div class="md:col-span-2 xl:col-span-8">
        <VolumeTimeseriesCard
          :points="timeseries.data.value"
          :metric="timeseriesMetric"
          :granularity="filters.granularity.value"
          :is-loading="timeseries.isLoading.value"
          :error="timeseries.error.value"
          @retry="timeseries.refresh"
          @metric="timeseriesMetric = $event"
        />
      </div>

      <div class="flex flex-col gap-px bg-slate-200 md:col-span-2 xl:col-span-4">
        <DistributionCard
          class="min-h-0 flex-1"
          title="By weekday"
          subtitle="Volume per day of week"
          variant="bar"
          :buckets="weekday.data.value"
          :is-loading="weekday.isLoading.value"
          :error="weekday.error.value"
          @retry="weekday.refresh"
        />
        <DistributionCard
          class="min-h-0 flex-1"
          title="By rep range"
          subtitle="Share of sets"
          variant="donut"
          :buckets="repRange.data.value"
          :is-loading="repRange.isLoading.value"
          :error="repRange.error.value"
          @retry="repRange.refresh"
        />
      </div>

      <div class="md:col-span-2 xl:col-span-12">
        <CalendarHeatmapCard
          :days="calendar.data.value"
          :year="filters.year.value"
          :available-years="availableYears"
          :is-loading="calendar.isLoading.value"
          :error="calendar.error.value"
          @retry="calendar.refresh"
          @year="filters.setYear"
        />
      </div>

      <div class="md:col-span-2 xl:col-span-6">
        <MuscleBalanceCard
          :heatmap="heatmap.data.value"
          :metric="heatmapMetric"
          :include-secondary="countSecondary"
          :is-loading="heatmap.isLoading.value"
          :error="heatmap.error.value"
          @retry="heatmap.refresh"
          @metric="heatmapMetric = $event"
          @toggle-secondary="countSecondary = !countSecondary"
        />
      </div>

      <div class="md:col-span-2 xl:col-span-6">
        <TopExercisesCard
          :exercises="exercises.data.value"
          :sort-by="sortBy"
          :is-loading="exercises.isLoading.value"
          :error="exercises.error.value"
          @retry="exercises.refresh"
          @sort-by="sortBy = $event"
        />
      </div>

      <div class="md:col-span-2 xl:col-span-12">
        <ExerciseProgressionCard
          :points="progression.data.value"
          :exercises="exerciseNames"
          :selected="selectedExercise"
          :metric="progressionMetric"
          :is-loading="progression.isLoading.value"
          :error="progression.error.value"
          @retry="progression.refresh"
          @select="selectedExercise = $event"
          @metric="progressionMetric = $event"
        />
      </div>

      <div class="md:col-span-2 xl:col-span-12">
        <RecordsTableCard
          :records="records.data.value"
          :is-loading="records.isLoading.value"
          :error="records.error.value"
          @retry="records.refresh"
        />
      </div>
    </div>
  </div>
</template>
