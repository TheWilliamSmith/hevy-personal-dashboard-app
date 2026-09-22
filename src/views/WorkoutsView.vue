<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import PaginationControls from '@/components/workouts/PaginationControls.vue';
import WorkoutCard from '@/components/workouts/WorkoutCard.vue';
import WorkoutCardSkeleton from '@/components/workouts/WorkoutCardSkeleton.vue';
import WorkoutFiltersBar from '@/components/workouts/WorkoutFilters.vue';
import { useHasActiveFilters, useWorkouts } from '@/composables/useWorkouts';

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

/** Carried into the detail route so the back link can restore this exact view. */
const backQuery = computed<Record<string, string>>(() => {
  const query: Record<string, string> = {};
  if (filters.value.search) query.search = filters.value.search;
  if (filters.value.exercise) query.exercise = filters.value.exercise;
  if (filters.value.from) query.from = filters.value.from;
  if (filters.value.to) query.to = filters.value.to;
  if (meta.value && meta.value.page > 1) query.page = String(meta.value.page);
  return query;
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
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
    <header>
      <h1 class="text-2xl font-semibold text-slate-900">Workouts</h1>
    </header>

    <WorkoutFiltersBar
      :filters="filters"
      :exercises="exercises"
      :has-active-filters="hasActiveFilters"
      @search="setSearch"
      @exercise="setExercise"
      @date-range="setDateRange"
      @clear="clearFilters"
    />

    <!-- Page and filter changes are announced here for screen readers. -->
    <p class="sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>

    <div :aria-busy="isLoading">
      <ul v-if="isLoading" class="flex flex-col gap-3">
        <WorkoutCardSkeleton :count="5" />
      </ul>

      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
        role="alert"
      >
        <p class="text-sm text-red-900">{{ error }}</p>
        <button
          type="button"
          class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="retry"
        >
          Retry
        </button>
      </div>

      <div
        v-else-if="workouts.length === 0"
        class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
      >
        <template v-if="hasActiveFilters">
          <p class="text-slate-700">No workouts match these filters.</p>
          <button
            type="button"
            class="mt-3 text-sm font-medium text-indigo-700 underline underline-offset-2"
            @click="clearFilters"
          >
            Clear all filters
          </button>
        </template>
        <template v-else>
          <p class="text-slate-700">No workouts yet.</p>
          <RouterLink
            :to="{ name: 'import' }"
            class="mt-3 inline-block text-sm font-medium text-indigo-700 underline underline-offset-2"
          >
            Import your Hevy export
          </RouterLink>
        </template>
      </div>

      <ul v-else class="flex flex-col gap-3">
        <WorkoutCard
          v-for="workout in workouts"
          :key="workout.id"
          :workout="workout"
          :back-query="backQuery"
        />
      </ul>
    </div>

    <PaginationControls
      v-if="meta && meta.totalPages > 1 && !error"
      :meta="meta"
      @change="goToPage"
    />
  </div>
</template>
