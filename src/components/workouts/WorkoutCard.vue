<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { WorkoutSummary } from '@/types/workouts';
import { formatDate, formatDuration, formatVolume } from '@/utils/format';

const props = defineProps<{ workout: WorkoutSummary; backQuery: Record<string, string> }>();

/** The API already truncates to five names and appends a "+n" entry. */
const isOverflowChip = (name: string): boolean => /^\+\d+$/.test(name);
</script>

<template>
  <li>
    <RouterLink
      :to="{
        name: 'home',
        query: { ...props.backQuery, tab: 'workouts', workout: props.workout.id },
      }"
      class="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <div class="flex items-baseline justify-between gap-4">
        <h3 class="truncate font-semibold text-slate-900">{{ props.workout.title }}</h3>
        <time :datetime="props.workout.startedAt" class="shrink-0 text-sm text-slate-500">
          {{ formatDate(props.workout.startedAt) }}
        </time>
      </div>

      <dl class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div class="flex gap-1">
          <dt class="text-slate-500">Duration</dt>
          <dd class="font-medium text-slate-800">{{ formatDuration(props.workout.durationSec) }}</dd>
        </div>
        <div class="flex gap-1">
          <dt class="text-slate-500">Exercises</dt>
          <dd class="font-medium text-slate-800">{{ props.workout.exerciseCount }}</dd>
        </div>
        <div class="flex gap-1">
          <dt class="text-slate-500">Sets</dt>
          <dd class="font-medium text-slate-800">{{ props.workout.setCount }}</dd>
        </div>
        <div class="flex gap-1">
          <dt class="text-slate-500">Volume</dt>
          <dd class="font-medium text-slate-800">{{ formatVolume(props.workout.totalVolumeKg) }}</dd>
        </div>
      </dl>

      <ul v-if="props.workout.exerciseNames.length" class="mt-3 flex flex-wrap gap-1.5">
        <li
          v-for="name in props.workout.exerciseNames"
          :key="name"
          class="rounded-full px-2.5 py-0.5 text-xs"
          :class="
            isOverflowChip(name)
              ? 'text-slate-500'
              : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 ring-inset'
          "
        >
          {{ isOverflowChip(name) ? `${name} more` : name }}
        </li>
      </ul>
    </RouterLink>
  </li>
</template>
