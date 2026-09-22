<script setup lang="ts">
import { computed } from 'vue';

import type { WorkoutExerciseDetail } from '@/types/workouts';
import { EMPTY, formatNumber, formatVolume, formatWeight } from '@/utils/format';
import { bestSetIndex } from '@/utils/sets';

import SetTypeBadge from './SetTypeBadge.vue';

const props = defineProps<{ exercise: WorkoutExerciseDetail }>();

const bestIndex = computed(() => bestSetIndex(props.exercise.sets, props.exercise.bestSet));

/** "60 × 10", or an em dash when neither operand is recorded. */
function weightByReps(weightKg: number | null, reps: number | null): string {
  if (weightKg === null && reps === null) {
    return EMPTY;
  }
  return `${formatWeight(weightKg)} × ${reps ?? EMPTY}`;
}

const cell = 'px-3 py-2 text-sm';
const head = 'px-3 py-2 text-left text-xs font-semibold text-slate-600';
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white">
    <header class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
      <h3 class="font-semibold text-slate-900">{{ props.exercise.name }}</h3>
      <span
        v-if="props.exercise.supersetId !== null"
        class="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200 ring-inset"
      >
        Superset {{ props.exercise.supersetId }}
      </span>
      <p class="ml-auto text-xs text-slate-500">
        {{ props.exercise.setCount }} sets
        <span aria-hidden="true"> · </span>
        {{ formatVolume(props.exercise.volumeKg) }}
      </p>
    </header>

    <p v-if="props.exercise.notes" class="border-b border-slate-100 px-4 py-2 text-sm text-slate-600">
      {{ props.exercise.notes }}
    </p>

    <table class="w-full border-collapse">
      <caption class="sr-only">Sets for {{ props.exercise.name }}</caption>
      <thead class="bg-slate-50">
        <tr>
          <th scope="col" :class="head">Set</th>
          <th scope="col" :class="head">Type</th>
          <th scope="col" :class="head">Weight × reps</th>
          <th scope="col" :class="head">Volume</th>
          <th scope="col" :class="head">RPE</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(set, index) in props.exercise.sets"
          :key="set.setIndex"
          class="border-t border-slate-100"
          :class="index === bestIndex ? 'bg-emerald-50' : ''"
        >
          <th scope="row" :class="[cell, 'text-left font-medium text-slate-700']">
            {{ set.setIndex + 1 }}
            <span v-if="index === bestIndex" class="ml-1 text-xs font-semibold text-emerald-700">
              Best<span class="sr-only"> set of this exercise</span>
            </span>
          </th>
          <td :class="cell"><SetTypeBadge :type="set.setType" /></td>
          <td :class="[cell, 'text-slate-800']">{{ weightByReps(set.weightKg, set.reps) }}</td>
          <td :class="[cell, 'text-slate-800']">{{ formatVolume(set.volumeKg) }}</td>
          <td :class="[cell, 'text-slate-800']">{{ formatNumber(set.rpe) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
