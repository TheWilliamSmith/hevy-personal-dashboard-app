<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import LatestWorkout from '@/components/workouts/LatestWorkout.vue';
import SessionVolumeChart from '@/components/workouts/SessionVolumeChart.vue';
import WorkoutFiltersBar from '@/components/workouts/WorkoutFilters.vue';
import WorkoutRow from '@/components/workouts/WorkoutRow.vue';
import { useStatsResource } from '@/composables/stats/useStatsResource';
import { useHasActiveFilters, useWorkouts } from '@/composables/useWorkouts';
import { apiGet } from '@/lib/api';
import type { Paginated, WorkoutSummary } from '@/types/workouts';

const router = useRouter();

const {
  workouts,
  meta,
  filters,
  exercises,
  isLoading,
  error,
  setSearch,
  setExercise,
  setDateRange,
  clearFilters,
  goToPage,
  retry,
} = useWorkouts();

const hasActiveFilters = useHasActiveFilters(filters);

const latest = useStatsResource(
  (signal) => apiGet<Paginated<WorkoutSummary>>('/workouts', { limit: 1 }, signal),
  () => null,
);

const backQuery = computed<Record<string, string>>(() => {
  const query: Record<string, string> = {};
  if (filters.value.search) query.search = filters.value.search;
  if (filters.value.exercise) query.exercise = filters.value.exercise;
  if (filters.value.from) query.from = filters.value.from;
  if (filters.value.to) query.to = filters.value.to;
  if (meta.value && meta.value.page > 1) query.page = String(meta.value.page);
  return query;
});

const listSubtitle = computed(() => {
  if (!meta.value) {
    return 'Newest first';
  }
  const scope = hasActiveFilters.value ? 'matching the filters' : 'in total';
  return `${meta.value.total} workouts ${scope} · newest first`;
});

const statusMessage = computed(() => {
  if (isLoading.value) {
    return 'Loading workouts…';
  }
  if (error.value) {
    return error.value;
  }
  if (!meta.value) {
    return '';
  }
  return `Page ${meta.value.page} of ${meta.value.totalPages}, ${meta.value.total} workouts`;
});

function openWorkout(id: string): void {
  void router.push({ name: 'home', query: { ...backQuery.value, tab: 'workouts', workout: id } });
}
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <SessionVolumeChart
          class="lg:pr-8"
          :workouts="error ? [] : workouts"
          :is-loading="isLoading"
          @open="openWorkout"
        />
        <LatestWorkout
          class="border-zinc-800 lg:border-l lg:pl-8"
          :workout="latest.data.value?.data[0] ?? null"
          :is-loading="latest.isLoading.value"
          :error="latest.error.value"
          @retry="latest.refresh"
        />
      </div>

      <section class="flex flex-col gap-5">
        <SectionHeader title="All workouts" :subtitle="listSubtitle" />

        <WorkoutFiltersBar
          :filters="filters"
          :exercises="exercises"
          :has-active-filters="hasActiveFilters"
          @search="setSearch"
          @exercise="setExercise"
          @date-range="setDateRange"
          @clear="clearFilters"
        />

        <p class="sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>

        <div :aria-busy="isLoading">
          <ul v-if="isLoading && workouts.length === 0" class="flex flex-col gap-3" aria-hidden="true">
            <li v-for="row in 8" :key="row" class="h-12 animate-pulse rounded-md bg-zinc-900" />
          </ul>

          <SectionError v-else-if="error" :message="error" @retry="retry" />

          <EmptyState v-else-if="workouts.length === 0 && hasActiveFilters" message="No workouts match these filters.">
            <button
              type="button"
              class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </EmptyState>
          <EmptyState v-else-if="workouts.length === 0" import-link message="No workouts yet." />

          <ul v-else :class="{ 'opacity-60 transition-opacity': isLoading }">
            <WorkoutRow v-for="workout in workouts" :key="workout.id" :workout="workout" :back-query="backQuery" />
          </ul>
        </div>

        <Pagination
          v-if="meta && meta.totalPages > 1 && !error"
          :meta="meta"
          label="Workouts pagination"
          unit="workouts"
          @change="goToPage"
        />
      </section>
    </div>
  </div>
</template>
