<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { ExerciseKind, ExerciseRecords, OneRepMaxRecord } from '@/types/exercises';
import {
  EMPTY,
  formatDate,
  formatDay,
  formatDecimal,
  formatDistanceKm,
  formatDuration,
  formatInteger,
  formatLoad,
  formatPace,
  formatVolume,
} from '@/utils/format';

import { relativeStrength } from '@/utils/measurements';

const props = defineProps<{ records: ExerciseRecords; kind: ExerciseKind; bodyweightKg?: number | null }>();

interface Tile {
  label: string;
  value: string;
  detail: string | null;
  date: string;
  workoutId: string;
}

function tile(label: string, value: string, detail: string | null, record: { date: string; workoutId: string }): Tile {
  return { label, value, detail, date: record.date, workoutId: record.workoutId };
}

function cardioTiles(records: ExerciseRecords): Tile[] {
  const result: Tile[] = [];
  if (records.longestDistanceKm) {
    result.push(tile(t('exercises.records.longestDistance'), formatDistanceKm(records.longestDistanceKm.value), null, records.longestDistanceKm));
  }
  if (records.longestDurationSec) {
    result.push(tile(t('exercises.records.longestDuration'), formatDuration(records.longestDurationSec.value), null, records.longestDurationSec));
  }
  if (records.bestPaceMinPerKm) {
    result.push(tile(t('exercises.records.bestPace'), formatPace(records.bestPaceMinPerKm.value), null, records.bestPaceMinPerKm));
  }
  return result;
}

function oneRepMaxTiles(record: OneRepMaxRecord, bodyweightKg: number | null): Tile[] {
  const detail =
    record.weightKg === null
      ? null
      : t('exercises.records.fromSet', { weight: formatLoad(record.weightKg), reps: record.reps ?? EMPTY });
  const result = [tile(t('exercises.records.oneRepMax'), formatLoad(record.value), detail, record)];
  const ratio = relativeStrength(record.value, bodyweightKg);
  if (ratio !== null && bodyweightKg) {
    result.push(
      tile(
        t('exercises.records.relativeStrength'),
        t('exercises.records.timesBodyweight', { ratio: formatDecimal(ratio, 2) }),
        t('exercises.records.atBodyweight', { weight: formatLoad(bodyweightKg) }),
        record,
      ),
    );
  }
  return result;
}

function strengthTiles(records: ExerciseRecords, bodyweightKg: number | null): Tile[] {
  const result = records.best1RM ? oneRepMaxTiles(records.best1RM, bodyweightKg) : [];
  if (records.maxWeight) {
    result.push(
      tile(
        t('exercises.records.maxWeight'),
        formatLoad(records.maxWeight.weightKg),
        t('exercises.records.timesReps', { reps: records.maxWeight.reps ?? EMPTY }),
        records.maxWeight,
      ),
    );
  }
  if (records.maxVolumeSession) {
    result.push(tile(t('exercises.records.bestVolume'), formatVolume(records.maxVolumeSession.value), null, records.maxVolumeSession));
  }
  if (records.maxReps) {
    const detail =
      records.maxReps.weightKg === null ? null : t('exercises.records.atWeight', { weight: formatLoad(records.maxReps.weightKg) });
    result.push(
      tile(t('exercises.records.maxReps'), t('exercises.records.reps', { count: formatInteger(records.maxReps.reps) }), detail, records.maxReps),
    );
  }
  return result;
}

const tiles = computed<Tile[]>(() =>
  props.kind === 'CARDIO' ? cardioTiles(props.records) : strengthTiles(props.records, props.bodyweightKg ?? null),
);

const hero = computed(() => tiles.value[0] ?? null);
const others = computed(() => tiles.value.slice(1));
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader :title="t('exercises.records.title')" :subtitle="t('exercises.records.subtitle')" />

    <EmptyState v-if="!hero" :message="t('exercises.records.none')" />

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
