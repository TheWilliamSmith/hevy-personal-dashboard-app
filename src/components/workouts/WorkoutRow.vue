<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { WorkoutSummary } from '@/types/workouts';
import { formatDate, formatDuration, formatInteger, formatVolume } from '@/utils/format';

const props = defineProps<{ workout: WorkoutSummary; backQuery: Record<string, string> }>();

const isOverflow = (name: string): boolean => /^\+\d+$/.test(name);

const stats = computed(() => [
  { label: t('workouts.duration'), value: formatDuration(props.workout.durationSec) },
  { label: t('workouts.exercises'), value: formatInteger(props.workout.exerciseCount) },
  { label: t('workouts.sets'), value: formatInteger(props.workout.setCount) },
  { label: t('workouts.volume'), value: formatVolume(props.workout.totalVolumeKg) },
]);

const exerciseSummary = computed(() =>
  props.workout.exerciseNames.map((name) => (isOverflow(name) ? t('workouts.more', { count: name }) : name)).join(' · '),
);
</script>

<template>
  <li class="border-b border-zinc-800 last:border-b-0">
    <RouterLink
      :to="{ name: 'home', query: { ...backQuery, tab: 'workouts', workout: workout.id } }"
      class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 rounded-md px-2 py-3 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400 lg:grid-cols-[minmax(0,2fr)_repeat(4,6rem)_auto]"
    >
      <span class="min-w-0">
        <span class="block truncate text-sm font-medium text-zinc-100" :title="workout.title">{{ workout.title }}</span>
        <span class="block truncate text-[11px] text-zinc-500">
          <time :datetime="workout.startedAt">{{ formatDate(workout.startedAt) }}</time>
          <template v-if="exerciseSummary"> · {{ exerciseSummary }}</template>
        </span>
      </span>

      <span v-for="stat in stats" :key="stat.label" class="hidden flex-col lg:flex">
        <span class="text-sm text-zinc-100 tabular-nums">{{ stat.value }}</span>
        <span class="text-[11px] text-zinc-500">{{ stat.label }}</span>
      </span>

      <span class="flex items-center gap-3">
        <span class="text-xs text-zinc-400 tabular-nums lg:hidden">
          {{ formatDuration(workout.durationSec) }} · {{ formatVolume(workout.totalVolumeKg) }}
        </span>
        <ChevronRight class="h-4 w-4 text-zinc-600" aria-hidden="true" />
      </span>
    </RouterLink>
  </li>
</template>
