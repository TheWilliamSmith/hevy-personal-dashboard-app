<script setup lang="ts">
import { ChevronLeft, Clock, Layers, Repeat, Weight } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import MetricGrid, { type MetricItem } from '@/components/ui/MetricGrid.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import ExerciseSection from '@/components/workouts/ExerciseSection.vue';
import ExerciseVolumeBars from '@/components/workouts/ExerciseVolumeBars.vue';
import { useWorkout } from '@/composables/useWorkout';
import { formatDate, formatDuration, formatInteger, formatVolume } from '@/utils/format';

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

const metrics = computed<MetricItem[]>(() => [
  { label: 'Total volume', value: formatVolume(workout.value?.totalVolumeKg), icon: Weight },
  { label: 'Sets', value: formatInteger(workout.value?.totalSets), icon: Layers },
  { label: 'Reps', value: formatInteger(workout.value?.totalReps), icon: Repeat },
  { label: 'Duration', value: formatDuration(workout.value?.durationSec), icon: Clock },
]);
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <RouterLink
        :to="{ name: 'home', query: { ...backQuery, tab: 'workouts' } }"
        class="-ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        All workouts
      </RouterLink>

      <div v-if="isLoading && !workout" class="flex flex-col gap-6" aria-busy="true">
        <div class="h-8 w-72 animate-pulse rounded bg-zinc-900" />
        <div class="h-16 animate-pulse rounded-md bg-zinc-900" />
        <div class="h-64 animate-pulse rounded-md bg-zinc-900" />
      </div>

      <div v-else-if="error && notFound" class="flex flex-col items-center gap-2 py-16 text-center">
        <p class="text-sm text-zinc-500">This workout does not exist.</p>
      </div>

      <SectionError v-else-if="error" :message="error" @retry="retry" />

      <template v-else-if="workout">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
          <section class="flex flex-col gap-8 lg:pr-8">
            <header>
              <h2 class="text-2xl font-semibold tracking-tight text-white">{{ workout.title }}</h2>
              <p class="mt-1 text-xs text-zinc-500">
                <time :datetime="workout.startedAt">{{ formatDate(workout.startedAt) }}</time>
                · {{ formatInteger(orderedExercises.length) }} exercises
              </p>
              <p v-if="workout.description" class="mt-3 max-w-prose text-sm text-zinc-400">
                {{ workout.description }}
              </p>
            </header>
            <MetricGrid :items="metrics" :is-loading="false" />
          </section>

          <ExerciseVolumeBars
            class="border-zinc-800 lg:border-l lg:pl-8"
            :exercises="orderedExercises"
            :total-volume-kg="workout.totalVolumeKg"
          />
        </div>

        <section class="flex flex-col gap-6">
          <SectionHeader title="Exercises" subtitle="In the order they were performed" />
          <p v-if="orderedExercises.length === 0" class="text-sm text-zinc-500">No exercise logged in this workout.</p>
          <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 xl:grid-cols-2">
            <ExerciseSection v-for="exercise in orderedExercises" :key="exercise.id" :exercise="exercise" />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
