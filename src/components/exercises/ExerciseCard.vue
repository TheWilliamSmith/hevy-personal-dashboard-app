<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import ExerciseSparkline from './ExerciseSparkline.vue';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, MUSCLE_STYLES } from '@/constants/muscles';
import type { ExerciseCard } from '@/types/exercises';
import { EMPTY, formatDistanceKm, formatDuration, formatInteger, formatWeight } from '@/utils/format';

const props = defineProps<{ exercise: ExerciseCard }>();

const neverPerformed = computed(() => props.exercise.sessions === 0);

const lastPerformed = computed(() => {
  const iso = props.exercise.lastPerformedAt;
  if (!iso) {
    return null;
  }

  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) {
    return 'today';
  }
  if (days === 1) {
    return 'yesterday';
  }
  return `${days} days ago`;
});

const best = computed(() => {
  const exercise = props.exercise;

  if (exercise.kind === 'CARDIO') {
    return exercise.totalDistanceKm === null
      ? EMPTY
      : formatDistanceKm(exercise.totalDistanceKm);
  }

  if (exercise.kind === 'BODYWEIGHT_HOLD') {
    return exercise.totalDurationSec === null ? EMPTY : formatDuration(exercise.totalDurationSec);
  }

  return exercise.maxWeightKg === null ? EMPTY : `${formatWeight(exercise.maxWeightKg)} kg`;
});

const bestLabel = computed(() =>
  props.exercise.kind === 'CARDIO'
    ? 'Distance'
    : props.exercise.kind === 'BODYWEIGHT_HOLD'
      ? 'Hold'
      : 'Max',
);
</script>

<template>
  <RouterLink
    :to="{ name: 'home', query: { tab: 'exercises', exercise: props.exercise.slug } }"
    class="flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    :class="neverPerformed ? 'opacity-60' : ''"
  >
    <div class="flex items-start gap-2">
      <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
        {{ props.exercise.name }}
      </h3>
      <span
        v-if="props.exercise.isCustom"
        class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200 ring-inset"
      >
        Custom
      </span>
    </div>

    <div class="flex flex-wrap gap-1">
      <span
        class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200 ring-inset"
      >
        {{ EQUIPMENT_LABELS[props.exercise.equipment] }}
      </span>
      <span
        v-for="muscle in props.exercise.secondaryMuscles"
        :key="muscle"
        class="rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset"
        :class="MUSCLE_STYLES[muscle].chip"
      >
        {{ MUSCLE_LABELS[muscle] }}
      </span>
    </div>

    <dl class="mt-auto grid grid-cols-3 gap-1 text-xs">
      <div>
        <dt class="text-[10px] text-slate-500">Sessions</dt>
        <dd class="font-semibold text-slate-800">{{ formatInteger(props.exercise.sessions) }}</dd>
      </div>
      <div>
        <dt class="text-[10px] text-slate-500">Sets</dt>
        <dd class="font-semibold text-slate-800">{{ formatInteger(props.exercise.totalSets) }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-[10px] text-slate-500">{{ bestLabel }}</dt>
        <dd class="truncate font-semibold text-slate-800">{{ best }}</dd>
      </div>
    </dl>

    <div class="flex items-center justify-between gap-2">
      <ExerciseSparkline
        :points="props.exercise.sparkline"
        :trend="props.exercise.trend"
        :width="72"
        :height="20"
      />
      <span class="truncate text-[10px] text-slate-500">
        {{ lastPerformed ? `Last: ${lastPerformed}` : 'Never performed' }}
      </span>
    </div>
  </RouterLink>
</template>
