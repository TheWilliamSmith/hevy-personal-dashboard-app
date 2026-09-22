<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { ExerciseKind, ExerciseRecords } from '@/types/exercises';
import {
  EMPTY,
  formatDate,
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

/**
 * Tiles are chosen by `kind`, not by null-checking every record: the API sends
 * a maxVolumeSession of 0 for CARDIO, which is non-null but meaningless there.
 * Records that are genuinely absent are dropped, so no empty tile renders.
 */
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

  if (records.maxWeight) {
    result.push({
      label: 'Max weight',
      value: `${formatWeight(records.maxWeight.weightKg)} kg`,
      detail: `× ${records.maxWeight.reps ?? EMPTY} reps`,
      date: records.maxWeight.date,
      workoutId: records.maxWeight.workoutId,
    });
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
</script>

<template>
  <div
    v-if="tiles.length > 0"
    class="grid grid-cols-1 gap-px border-y border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4"
  >
    <RouterLink
      v-for="tile in tiles"
      :key="tile.label"
      :to="{ name: 'home', query: { tab: 'workouts', workout: tile.workoutId } }"
      class="flex flex-col gap-0.5 bg-white px-4 py-3 transition-colors hover:bg-indigo-50/40"
    >
      <span class="text-xs font-medium text-slate-500">{{ tile.label }}</span>
      <span class="text-xl font-semibold text-slate-900">{{ tile.value }}</span>
      <span v-if="tile.detail" class="text-xs text-slate-600">{{ tile.detail }}</span>
      <time :datetime="tile.date" class="text-xs text-slate-400">{{ formatDate(tile.date) }}</time>
    </RouterLink>
  </div>
</template>
