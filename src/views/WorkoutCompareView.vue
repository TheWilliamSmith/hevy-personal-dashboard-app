<script setup lang="ts">
import { ArrowLeftRight, ChevronLeft } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import CompareWorkoutDialog from '@/components/workouts/CompareWorkoutDialog.vue';
import { useWorkout } from '@/composables/useWorkout';
import { t } from '@/i18n';
import type { BestSet, WorkoutDetail, WorkoutExerciseDetail } from '@/types/workouts';
import {
  EMPTY,
  formatDate,
  formatDuration,
  formatInteger,
  formatLoad,
  formatPercent,
  formatVolume,
  percentChange,
} from '@/utils/format';
import { matchExercises } from '@/utils/workout-compare';

const route = useRoute();
const router = useRouter();

const currentId = computed(() => (typeof route.query.workout === 'string' ? route.query.workout : ''));
const referenceId = computed(() => (typeof route.query.compare === 'string' ? route.query.compare : ''));

const current = useWorkout(currentId);
const reference = useWorkout(referenceId);

const pickerOpen = ref(false);

const isLoading = computed(
  () => (current.isLoading.value && !current.workout.value) || (reference.isLoading.value && !reference.workout.value),
);
const error = computed(() => current.error.value ?? reference.error.value);
const sameWorkout = computed(() => currentId.value === referenceId.value);

function retry(): void {
  current.retry();
  reference.retry();
}

const backQuery = computed<Record<string, string>>(() => {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(route.query)) {
    if (key !== 'compare' && typeof value === 'string') {
      query[key] = value;
    }
  }
  return query;
});

function choose(id: string): void {
  pickerOpen.value = false;
  void router.replace({ name: 'home', query: { ...route.query, compare: id } });
}

interface SummaryRow {
  label: string;
  current: string;
  reference: string;
  change: number | null;
}

const summary = computed<SummaryRow[]>(() => {
  const left = current.workout.value;
  const right = reference.workout.value;
  if (!left || !right) {
    return [];
  }
  const row = (label: string, pick: (workout: WorkoutDetail) => number, render: (value: number) => string) => ({
    label,
    current: render(pick(left)),
    reference: render(pick(right)),
    change: percentChange(pick(left), pick(right)),
  });
  return [
    row(t('workouts.compare.duration'), (workout) => workout.durationSec, formatDuration),
    row(t('workouts.compare.volume'), (workout) => workout.totalVolumeKg, formatVolume),
    row(t('workouts.compare.sets'), (workout) => workout.totalSets, formatInteger),
    row(t('workouts.compare.reps'), (workout) => workout.totalReps, formatInteger),
  ];
});

const match = computed(() =>
  current.workout.value && reference.workout.value
    ? matchExercises(current.workout.value.exercises, reference.workout.value.exercises)
    : null,
);

function bestSet(set: BestSet | null): string {
  if (!set || (set.weightKg === null && set.reps === null)) {
    return EMPTY;
  }
  return `${formatLoad(set.weightKg)} × ${set.reps ?? EMPTY}`;
}

function changeClass(change: number | null): string {
  if (change === null || Math.abs(change) < 0.05) {
    return 'text-zinc-500';
  }
  return change > 0 ? 'text-emerald-400' : 'text-red-400';
}

function exerciseSummary(exercise: WorkoutExerciseDetail): string {
  return t(
    'workouts.compare.exerciseSummary',
    { count: exercise.setCount, volume: formatVolume(exercise.volumeKg) },
    exercise.setCount,
  );
}

const head = 'px-3 py-2 text-left text-[11px] font-medium text-zinc-500';
const cell = 'px-3 py-2.5 text-sm';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <RouterLink
          :to="{ name: 'home', query: backQuery }"
          class="-ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
          :class="focus"
        >
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
          {{ t('workouts.compare.back') }}
        </RouterLink>
        <button
          v-if="current.workout.value"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
          :class="focus"
          @click="pickerOpen = true"
        >
          <ArrowLeftRight class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('workouts.compare.change') }}
        </button>
      </div>

      <div v-if="isLoading" class="flex flex-col gap-6" aria-busy="true">
        <div class="h-20 animate-pulse rounded-md bg-zinc-900" />
        <div class="h-48 animate-pulse rounded-md bg-zinc-900" />
      </div>

      <SectionError v-else-if="error" :message="error" @retry="retry" />

      <EmptyState v-else-if="sameWorkout" :message="t('workouts.compare.sameWorkout')" />

      <template v-else-if="current.workout.value && reference.workout.value && match">
        <div class="grid grid-cols-2 gap-6 border-b border-zinc-800 pb-6">
          <header class="min-w-0">
            <p class="text-xs text-zinc-500">{{ t('workouts.compare.current') }}</p>
            <h2 class="mt-1 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {{ current.workout.value.title }}
            </h2>
            <time :datetime="current.workout.value.startedAt" class="text-xs text-zinc-500">
              {{ formatDate(current.workout.value.startedAt) }}
            </time>
          </header>
          <header class="min-w-0 border-l border-zinc-800 pl-6">
            <p class="text-xs text-zinc-500">{{ t('workouts.compare.reference') }}</p>
            <RouterLink
              :to="{ name: 'home', query: { tab: 'workouts', workout: reference.workout.value.id } }"
              class="mt-1 block truncate rounded text-xl font-semibold tracking-tight text-white hover:underline sm:text-2xl"
              :class="focus"
            >
              {{ reference.workout.value.title }}
            </RouterLink>
            <time :datetime="reference.workout.value.startedAt" class="text-xs text-zinc-500">
              {{ formatDate(reference.workout.value.startedAt) }}
            </time>
          </header>
        </div>

        <section class="flex flex-col gap-4">
          <SectionHeader :title="t('workouts.compare.summary')" :subtitle="t('workouts.compare.summarySubtitle')" />
          <dl class="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            <div
              v-for="(row, index) in summary"
              :key="row.label"
              class="flex flex-col-reverse border-zinc-800 pr-4"
              :class="index % 2 === 1 ? 'border-l pl-4' : index > 0 ? 'sm:border-l sm:pl-4' : ''"
            >
              <dt class="mt-1 text-xs text-zinc-500">{{ row.label }}</dt>
              <dd class="flex flex-col">
                <span class="text-2xl font-semibold text-white tabular-nums">{{ row.current }}</span>
                <span class="text-xs text-zinc-500 tabular-nums">
                  {{ row.reference }}
                  <span :class="changeClass(row.change)"> · {{ formatPercent(row.change) }}</span>
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section class="flex flex-col gap-4">
          <SectionHeader
            :title="t('workouts.compare.shared')"
            :subtitle="t('workouts.compare.sharedSubtitle', { count: match.pairs.length }, match.pairs.length)"
          />
          <EmptyState v-if="match.pairs.length === 0" :message="t('workouts.compare.noShared')" />
          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-zinc-800">
                <th scope="col" :class="head">{{ t('workouts.compare.exercise') }}</th>
                <th scope="col" :class="[head, 'hidden sm:table-cell']">{{ t('workouts.compare.bestSet') }}</th>
                <th scope="col" :class="[head, 'text-right']">{{ t('workouts.compare.volume') }}</th>
                <th scope="col" :class="[head, 'text-right']">{{ t('workouts.compare.difference') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pair in match.pairs" :key="pair.key" class="border-b border-zinc-800/60 last:border-b-0">
                <th scope="row" :class="[cell, 'text-left font-medium text-zinc-100']">{{ pair.name }}</th>
                <td :class="[cell, 'hidden tabular-nums sm:table-cell']">
                  <span class="block text-zinc-100">{{ bestSet(pair.current.bestSet) }}</span>
                  <span class="block text-xs text-zinc-500">{{ bestSet(pair.reference.bestSet) }}</span>
                </td>
                <td :class="[cell, 'text-right tabular-nums']">
                  <span class="block text-zinc-100">{{ formatVolume(pair.current.volumeKg) }}</span>
                  <span class="block text-xs text-zinc-500">{{ formatVolume(pair.reference.volumeKg) }}</span>
                </td>
                <td
                  :class="[cell, 'text-right tabular-nums', changeClass(percentChange(pair.current.volumeKg, pair.reference.volumeKg))]"
                >
                  {{ formatPercent(percentChange(pair.current.volumeKg, pair.reference.volumeKg)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-2 sm:gap-0">
          <section class="flex flex-col gap-3 sm:pr-8">
            <SectionHeader :title="t('workouts.compare.onlyCurrent')" />
            <p v-if="match.onlyCurrent.length === 0" class="text-sm text-zinc-500">{{ t('workouts.compare.none') }}</p>
            <ul v-else class="flex flex-col gap-1">
              <li v-for="exercise in match.onlyCurrent" :key="exercise.id" class="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                <span class="min-w-0 truncate text-zinc-200">{{ exercise.name }}</span>
                <span class="shrink-0 text-xs text-zinc-500 tabular-nums">{{ exerciseSummary(exercise) }}</span>
              </li>
            </ul>
          </section>
          <section class="flex flex-col gap-3 border-zinc-800 sm:border-l sm:pl-8">
            <SectionHeader :title="t('workouts.compare.onlyReference')" />
            <p v-if="match.onlyReference.length === 0" class="text-sm text-zinc-500">{{ t('workouts.compare.none') }}</p>
            <ul v-else class="flex flex-col gap-1">
              <li v-for="exercise in match.onlyReference" :key="exercise.id" class="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                <span class="min-w-0 truncate text-zinc-200">{{ exercise.name }}</span>
                <span class="shrink-0 text-xs text-zinc-500 tabular-nums">{{ exerciseSummary(exercise) }}</span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </div>

    <CompareWorkoutDialog
      v-if="current.workout.value"
      :open="pickerOpen"
      :workout="current.workout.value"
      :selected-id="referenceId"
      @close="pickerOpen = false"
      @select="choose"
    />
  </div>
</template>
