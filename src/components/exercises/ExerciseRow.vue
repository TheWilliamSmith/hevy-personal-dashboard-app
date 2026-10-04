<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import ExerciseSparkline from '@/components/exercises/ExerciseSparkline.vue';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/constants/muscles';
import type { ExerciseCard } from '@/types/exercises';
import { EMPTY, formatDistanceKm, formatDuration, formatInteger, formatLoad } from '@/utils/format';
import { formatDaysAgo } from '@/utils/progress';

const props = defineProps<{ exercise: ExerciseCard }>();

const neverPerformed = computed(() => props.exercise.sessions === 0);

const lastPerformed = computed(() => {
  const iso = props.exercise.lastPerformedAt;
  return iso ? formatDaysAgo((Date.now() - Date.parse(iso)) / 86_400_000) : t('exercises.neverPerformed');
});

const best = computed(() => {
  const exercise = props.exercise;
  if (exercise.kind === 'CARDIO') {
    return { label: t('exercises.distance'), value: exercise.totalDistanceKm === null ? EMPTY : formatDistanceKm(exercise.totalDistanceKm) };
  }
  if (exercise.kind === 'BODYWEIGHT_HOLD') {
    return { label: t('exercises.hold'), value: exercise.totalDurationSec === null ? EMPTY : formatDuration(exercise.totalDurationSec) };
  }
  return { label: t('exercises.max'), value: exercise.maxWeightKg === null ? EMPTY : formatLoad(exercise.maxWeightKg) };
});

const meta = computed(() =>
  [
    EQUIPMENT_LABELS[props.exercise.equipment],
    ...(props.exercise.secondaryMuscles ?? []).map((muscle) => MUSCLE_LABELS[muscle]),
  ].join(' · '),
);

const sessionsLabel = computed(
  () => t('exercises.sessionCount', { count: formatInteger(props.exercise.sessions) }, props.exercise.sessions),
);

const stats = computed(() => [
  { label: t('exercises.sessions'), value: formatInteger(props.exercise.sessions) },
  { label: t('exercises.sets'), value: formatInteger(props.exercise.totalSets) },
  best.value,
]);
</script>

<template>
  <li class="border-b border-zinc-800 last:border-b-0" :class="{ 'opacity-50': neverPerformed }">
    <RouterLink
      :to="{ name: 'home', query: { tab: 'exercises', exercise: exercise.slug } }"
      class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 rounded-md px-2 py-3 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400 lg:grid-cols-[minmax(0,2fr)_6.5rem_repeat(3,5.5rem)_8rem_auto]"
    >
      <span class="min-w-0">
        <span class="flex items-center gap-2">
          <span class="truncate text-sm font-medium text-zinc-100">{{ exercise.name }}</span>
          <span v-if="exercise.isCustom" class="shrink-0 text-[11px] text-amber-400">{{ t('exercises.custom') }}</span>
        </span>
        <span class="block truncate text-[11px] text-zinc-500">{{ meta }}</span>
      </span>

      <span v-if="neverPerformed" class="hidden lg:block" />
      <ExerciseSparkline
        v-else
        class="hidden lg:flex"
        :points="exercise.sparkline"
        :trend="exercise.trend"
        :width="72"
        :height="20"
      />

      <span v-for="stat in stats" :key="stat.label" class="hidden flex-col lg:flex">
        <span class="truncate text-sm text-zinc-100 tabular-nums">{{ stat.value }}</span>
        <span class="text-[11px] text-zinc-500">{{ stat.label }}</span>
      </span>

      <span class="hidden text-xs text-zinc-400 lg:block">{{ lastPerformed }}</span>

      <span class="flex items-center gap-3">
        <span class="text-xs text-zinc-400 tabular-nums lg:hidden">
          {{ neverPerformed ? t('exercises.neverPerformed') : `${sessionsLabel} · ${best.value}` }}
        </span>
        <ChevronRight class="h-4 w-4 text-zinc-600" aria-hidden="true" />
      </span>
    </RouterLink>
  </li>
</template>
