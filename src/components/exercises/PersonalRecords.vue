<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { ExerciseKind, ExerciseRecords } from '@/types/exercises';
import {
  EMPTY,
  formatDate,
  formatDay,
  formatDistanceKm,
  formatDuration,
  formatInteger,
  formatPace,
  formatVolume,
  formatWeight,
} from '@/utils/format';

const props = defineProps<{ records: ExerciseRecords; kind: ExerciseKind }>();

interface Tile {
  label: string;
  value: string;
  detail: string | null;
  date: string;
  workoutId: string;
}

const tiles = computed<Tile[]>(() => {
  const records = props.records;
  const result: Tile[] = [];

  if (props.kind === 'CARDIO') {
    if (records.longestDistanceKm) {
      result.push({
        label: 'Longest distance',
        value: formatDistanceKm(records.longestDistanceKm.value),
        detail: null,
        date: records.longestDistanceKm.date,
        workoutId: records.longestDistanceKm.workoutId,
      });
    }
    if (records.longestDurationSec) {
      result.push({
        label: 'Longest duration',
        value: formatDuration(records.longestDurationSec.value),
        detail: null,
        date: records.longestDurationSec.date,
        workoutId: records.longestDurationSec.workoutId,
      });
    }
    if (records.bestPaceMinPerKm) {
      result.push({
        label: 'Best pace',
        value: formatPace(records.bestPaceMinPerKm.value),
        detail: null,
        date: records.bestPaceMinPerKm.date,
        workoutId: records.bestPaceMinPerKm.workoutId,
      });
    }
    return result;
  }

  if (records.best1RM) {
    result.push({
      label: 'Estimated 1RM',
      value: `${formatWeight(records.best1RM.value)} kg`,
      detail:
        records.best1RM.weightKg === null
          ? null
          : `from ${formatWeight(records.best1RM.weightKg)} kg × ${records.best1RM.reps ?? EMPTY}`,
      date: records.best1RM.date,
      workoutId: records.best1RM.workoutId,
    });
  }
  if (records.maxWeight) {
    result.push({
      label: 'Max weight',
      value: `${formatWeight(records.maxWeight.weightKg)} kg`,
      detail: `× ${records.maxWeight.reps ?? EMPTY} reps`,
      date: records.maxWeight.date,
      workoutId: records.maxWeight.workoutId,
    });
  }
  if (records.maxVolumeSession) {
    result.push({
      label: 'Best session volume',
      value: formatVolume(records.maxVolumeSession.value),
      detail: null,
      date: records.maxVolumeSession.date,
      workoutId: records.maxVolumeSession.workoutId,
    });
  }
  if (records.maxReps) {
    result.push({
      label: 'Max reps',
      value: `${formatInteger(records.maxReps.reps)} reps`,
      detail:
        records.maxReps.weightKg === null ? null : `at ${formatWeight(records.maxReps.weightKg)} kg`,
      date: records.maxReps.date,
      workoutId: records.maxReps.workoutId,
    });
  }

  return result;
});

const hero = computed(() => tiles.value[0] ?? null);
const others = computed(() => tiles.value.slice(1));
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader title="Personal records" subtitle="Best efforts on this exercise" />

    <p v-if="!hero" class="text-sm text-zinc-500">No record yet.</p>

    <template v-else>
      <RouterLink
        :to="{ name: 'home', query: { tab: 'workouts', workout: hero.workoutId } }"
        class="-mx-2 block rounded-md px-2 py-1 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
      >
        <span class="block text-xs text-zinc-500">{{ hero.label }}</span>
        <span class="block text-5xl font-semibold tracking-tight text-white tabular-nums">{{ hero.value }}</span>
        <span class="mt-2 block text-sm text-zinc-400">
          <template v-if="hero.detail">{{ hero.detail }} · </template>
          <time :datetime="hero.date">{{ formatDate(hero.date) }}</time>
        </span>
      </RouterLink>

      <ul v-if="others.length > 0" class="mt-auto flex flex-col gap-1">
        <li v-for="tile in others" :key="tile.label">
          <RouterLink
            :to="{ name: 'home', query: { tab: 'workouts', workout: tile.workoutId } }"
            class="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-zinc-200">{{ tile.label }}</span>
              <span class="block truncate text-[11px] text-zinc-500">
                <template v-if="tile.detail">{{ tile.detail }} · </template>{{ formatDay(tile.date) }}
              </span>
            </span>
            <span class="shrink-0 text-zinc-100 tabular-nums">{{ tile.value }}</span>
          </RouterLink>
        </li>
      </ul>
    </template>
  </section>
</template>
