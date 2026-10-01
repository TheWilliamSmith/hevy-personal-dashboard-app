<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';

import type { WorkoutExerciseDetail } from '@/types/workouts';
import { EMPTY, formatNumber, formatVolume, formatWeight } from '@/utils/format';
import { bestSetIndex, SET_TYPE_DOT_CLASSES, SET_TYPE_LABELS } from '@/utils/sets';

const props = defineProps<{ exercise: WorkoutExerciseDetail }>();

const bestIndex = computed(() => bestSetIndex(props.exercise.sets, props.exercise.bestSet));

function weightByReps(weightKg: number | null, reps: number | null): string {
  if (weightKg === null && reps === null) {
    return EMPTY;
  }
  return `${formatWeight(weightKg)} × ${reps ?? EMPTY}`;
}

const cell = 'px-2 py-2 text-sm';
const head = 'px-2 py-2 text-left text-[11px] font-medium text-zinc-500';
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-100">
          {{ exercise.name }}
          <span
            v-if="exercise.supersetId !== null"
            class="flex items-center gap-1 text-[11px] font-normal text-sky-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
            {{ t('workouts.superset', { id: exercise.supersetId }) }}
          </span>
        </h3>
        <p v-if="exercise.notes" class="mt-0.5 text-xs text-zinc-400">{{ exercise.notes }}</p>
      </div>
      <p class="shrink-0 text-right">
        <span class="text-sm font-semibold text-white tabular-nums">{{ formatVolume(exercise.volumeKg) }}</span>
        <span class="block text-[11px] text-zinc-500">{{ t('workouts.setCount', { count: exercise.setCount }, exercise.setCount) }}</span>
      </p>
    </div>

    <table class="w-full border-collapse">
      <caption class="sr-only">{{ t('workouts.setsFor', { name: exercise.name }) }}</caption>
      <thead>
        <tr class="border-b border-zinc-800">
          <th scope="col" :class="head">{{ t('workouts.set') }}</th>
          <th scope="col" :class="head">{{ t('workouts.type') }}</th>
          <th scope="col" :class="head">{{ t('workouts.weightReps') }}</th>
          <th scope="col" :class="head">{{ t('workouts.volume') }}</th>
          <th scope="col" :class="head">{{ t('workouts.rpe') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(set, index) in exercise.sets"
          :key="set.setIndex"
          class="border-b border-zinc-800/60 last:border-b-0"
          :class="index === bestIndex ? 'bg-emerald-400/10' : ''"
        >
          <th scope="row" :class="[cell, 'text-left font-normal text-zinc-400 tabular-nums']">
            {{ set.setIndex + 1 }}
            <span v-if="index === bestIndex" class="ml-1 text-[11px] font-medium text-emerald-400">
              {{ t('workouts.best') }}<span class="sr-only">{{ t('workouts.bestSet') }}</span>
            </span>
          </th>
          <td :class="cell">
            <span class="flex items-center gap-1.5 text-xs text-zinc-400">
              <span class="h-1.5 w-1.5 rounded-full" :class="SET_TYPE_DOT_CLASSES[set.setType]" aria-hidden="true" />
              {{ SET_TYPE_LABELS[set.setType] }}
            </span>
          </td>
          <td :class="[cell, 'text-zinc-100 tabular-nums']">{{ weightByReps(set.weightKg, set.reps) }}</td>
          <td :class="[cell, 'text-zinc-100 tabular-nums']">{{ formatVolume(set.volumeKg) }}</td>
          <td :class="[cell, 'text-zinc-400 tabular-nums']">{{ formatNumber(set.rpe) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
