<script setup lang="ts">
import { t } from '@/i18n';
import { ArrowLeftRight, ChevronLeft, Clock, Layers, Repeat, Weight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import MetricGrid, { type MetricItem } from '@/components/ui/MetricGrid.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import CompareWorkoutDialog from '@/components/workouts/CompareWorkoutDialog.vue';
import ExerciseSection from '@/components/workouts/ExerciseSection.vue';
import ExerciseVolumeBars from '@/components/workouts/ExerciseVolumeBars.vue';
import { useWorkout } from '@/composables/useWorkout';
import { formatDate, formatDuration, formatInteger, formatVolume } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const pickerOpen = ref(false);

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

function compareWith(compare: string): void {
  pickerOpen.value = false;
  void router.push({ name: 'home', query: { ...route.query, compare } });
}

const orderedExercises = computed(() =>
  [...(workout.value?.exercises ?? [])].sort((a, b) => a.order - b.order),
);

const metrics = computed<MetricItem[]>(() => [
  { label: t('workouts.totalVolume'), value: formatVolume(workout.value?.totalVolumeKg), icon: Weight },
  { label: t('workouts.sets'), value: formatInteger(workout.value?.totalSets), icon: Layers },
  { label: t('workouts.reps'), value: formatInteger(workout.value?.totalReps), icon: Repeat },
  { label: t('workouts.duration'), value: formatDuration(workout.value?.durationSec), icon: Clock },
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
        {{ t('workouts.all') }}
      </RouterLink>

      <div v-if="isLoading && !workout" class="flex flex-col gap-6" aria-busy="true">
        <div class="h-8 w-72 animate-pulse rounded bg-zinc-900" />
        <div class="h-16 animate-pulse rounded-md bg-zinc-900" />
        <div class="h-64 animate-pulse rounded-md bg-zinc-900" />
      </div>

      <EmptyState v-else-if="error && notFound" :message="t('workouts.notFound')" />

      <SectionError v-else-if="error" :message="error" @retry="retry" />

      <template v-else-if="workout">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
          <section class="flex flex-col gap-8 lg:pr-8">
            <header>
              <div class="flex items-start justify-between gap-3">
                <h2 class="min-w-0 text-2xl font-semibold tracking-tight text-white">{{ workout.title }}</h2>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                  @click="pickerOpen = true"
                >
                  <ArrowLeftRight class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ t('workouts.compare.button') }}
                </button>
              </div>
              <p class="mt-1 text-xs text-zinc-500">
                <time :datetime="workout.startedAt">{{ formatDate(workout.startedAt) }}</time>
                · {{ t('workouts.exerciseCount', { count: formatInteger(orderedExercises.length) }) }}
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
          <SectionHeader :title="t('workouts.exercises')" :subtitle="t('workouts.exercisesSubtitle')" />
          <EmptyState v-if="orderedExercises.length === 0" :message="t('workouts.noExercise')" />
          <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 xl:grid-cols-2">
            <ExerciseSection v-for="exercise in orderedExercises" :key="exercise.id" :exercise="exercise" />
          </div>
        </section>

        <CompareWorkoutDialog :open="pickerOpen" :workout="workout" @close="pickerOpen = false" @select="compareWith" />
      </template>
    </div>
  </div>
</template>
