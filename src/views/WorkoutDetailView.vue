<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import ExerciseSection from '@/components/workouts/ExerciseSection.vue';
import { useWorkout } from '@/composables/useWorkout';
import { formatDate, formatDuration, formatVolume } from '@/utils/format';

const route = useRoute();

const id = computed(() => (typeof route.query.workout === 'string' ? route.query.workout : ''));
const { workout, isLoading, error, notFound, retry } = useWorkout(id);

const backQuery = computed<Record<string, string>>(() => {
  const query: Record<string, string> = {};
  for (const key of ['search', 'exercise', 'from', 'to', 'page'] as const) {
    const value = route.query[key];
    if (typeof value === 'string' && value !== '') {
      query[key] = value;
    }
  }
  return query;
});

const orderedExercises = computed(() =>
  [...(workout.value?.exercises ?? [])].sort((a, b) => a.order - b.order),
);
</script>

<template>
  <div class="flex flex-col gap-6 px-4 sm:px-6">
    <RouterLink
      :to="{ name: 'home', query: { ...backQuery, tab: 'workouts' } }"
      class="text-sm font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
    >
      ← Back to workouts
    </RouterLink>

    <div :aria-busy="isLoading">
      <div v-if="isLoading" class="flex flex-col gap-4">
        <div class="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="tile in 3" :key="tile" class="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div v-for="block in 2" :key="block" class="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
        role="alert"
      >
        <p class="text-sm text-red-900">
          {{ notFound ? 'This workout does not exist.' : error }}
        </p>
        <button
          v-if="!notFound"
          type="button"
          class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="retry"
        >
          Retry
        </button>
      </div>

      <article v-else-if="workout" class="flex flex-col gap-6">
        <header>
          <h1 class="text-2xl font-semibold text-slate-900">{{ workout.title }}</h1>
          <p class="mt-1 text-sm text-slate-500">
            <time :datetime="workout.startedAt">{{ formatDate(workout.startedAt) }}</time>
            <span aria-hidden="true"> · </span>
            {{ formatDuration(workout.durationSec) }}
          </p>
          <p v-if="workout.description" class="mt-2 text-sm text-slate-700">
            {{ workout.description }}
          </p>
        </header>

        <dl class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <dt class="text-xs font-medium text-slate-500">Total volume</dt>
            <dd class="mt-1 text-xl font-semibold text-slate-900">
              {{ formatVolume(workout.totalVolumeKg) }}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <dt class="text-xs font-medium text-slate-500">Total sets</dt>
            <dd class="mt-1 text-xl font-semibold text-slate-900">{{ workout.totalSets }}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <dt class="text-xs font-medium text-slate-500">Total reps</dt>
            <dd class="mt-1 text-xl font-semibold text-slate-900">{{ workout.totalReps }}</dd>
          </div>
        </dl>

        <div class="grid items-start gap-4 xl:grid-cols-2">
          <ExerciseSection
            v-for="exercise in orderedExercises"
            :key="exercise.id"
            :exercise="exercise"
          />
        </div>
      </article>
    </div>
  </div>
</template>
