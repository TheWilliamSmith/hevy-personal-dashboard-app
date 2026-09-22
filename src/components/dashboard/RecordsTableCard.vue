<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import ChartCard from './ChartCard.vue';
import type { ExerciseRecords } from '@/types/stats';
import { EMPTY, formatDate, formatVolume, formatWeight } from '@/utils/format';

const props = defineProps<{
  records: ExerciseRecords[] | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

type SortKey = 'exercise' | 'maxWeightKg' | 'best1RM' | 'date';

const sortKey = ref<SortKey>('best1RM');
const ascending = ref(false);

function toggle(key: SortKey): void {
  if (sortKey.value === key) {
    ascending.value = !ascending.value;
    return;
  }
  sortKey.value = key;
  // Text reads naturally A-Z; numbers and dates are most useful highest-first.
  ascending.value = key === 'exercise';
}

/** The date column follows whichever record the row is ranked on. */
function rowDate(record: ExerciseRecords): string | null {
  return record.best1RM?.date ?? record.maxWeightKg?.date ?? null;
}

const rows = computed(() => {
  const list = [...(props.records ?? [])];
  const direction = ascending.value ? 1 : -1;

  return list.sort((left, right) => {
    const key = sortKey.value;

    if (key === 'exercise') {
      return left.exercise.localeCompare(right.exercise, 'fr') * direction;
    }

    if (key === 'date') {
      const a = rowDate(left);
      const b = rowDate(right);
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return (Date.parse(a) - Date.parse(b)) * direction;
    }

    // Nulls sort last whichever way the column points.
    const a = left[key]?.value ?? null;
    const b = right[key]?.value ?? null;
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * direction;
  });
});

const hasData = computed(() => rows.value.length > 0);

function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) {
    return 'none';
  }
  return ascending.value ? 'ascending' : 'descending';
}

/** Prefers the 1RM record's workout, falling back to the max-weight one. */
function workoutId(record: ExerciseRecords): string | null {
  return record.best1RM?.workoutId ?? record.maxWeightKg?.workoutId ?? null;
}

const head = 'px-3 py-2 text-left text-xs font-semibold text-slate-600';
const cell = 'px-3 py-2 text-sm text-slate-800';
</script>

<template>
  <ChartCard
    title="Personal records"
    subtitle="Best set per exercise, all time"
    :is-loading="props.isLoading"
    :error="props.error"
    :is-empty="!hasData"
    :height="360"
    @retry="emit('retry')"
  >
    <div class="h-full overflow-auto">
      <table class="w-full border-collapse">
        <caption class="sr-only">Personal records, sortable by column</caption>
        <thead class="sticky top-0 bg-slate-50">
          <tr>
            <th scope="col" :class="head" :aria-sort="ariaSort('exercise')">
              <button type="button" class="hover:text-slate-900" @click="toggle('exercise')">
                Exercise
              </button>
            </th>
            <th scope="col" :class="head" :aria-sort="ariaSort('maxWeightKg')">
              <button type="button" class="hover:text-slate-900" @click="toggle('maxWeightKg')">
                Max weight × reps
              </button>
            </th>
            <th scope="col" :class="head" :aria-sort="ariaSort('best1RM')">
              <button type="button" class="hover:text-slate-900" @click="toggle('best1RM')">
                Est. 1RM
              </button>
            </th>
            <th scope="col" :class="head">Best session volume</th>
            <th scope="col" :class="head" :aria-sort="ariaSort('date')">
              <button type="button" class="hover:text-slate-900" @click="toggle('date')">Date</button>
            </th>
            <th scope="col" :class="head">Workout</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in rows" :key="record.exercise" class="border-t border-slate-100">
            <th scope="row" :class="[cell, 'text-left font-medium']">{{ record.exercise }}</th>
            <td :class="cell">
              <template v-if="record.maxWeightKg">
                {{ formatWeight(record.maxWeightKg.value) }} kg × {{ record.maxWeightKg.reps ?? EMPTY }}
              </template>
              <template v-else>{{ EMPTY }}</template>
            </td>
            <td :class="cell">
              {{ record.best1RM ? `${formatWeight(record.best1RM.value)} kg` : EMPTY }}
            </td>
            <td :class="cell">
              {{ record.maxVolumeSession ? formatVolume(record.maxVolumeSession.value) : EMPTY }}
            </td>
            <td :class="cell">{{ formatDate(rowDate(record)) }}</td>
            <td :class="cell">
              <RouterLink
                v-if="workoutId(record)"
                :to="{ name: 'home', query: { tab: 'workouts', workout: workoutId(record) } }"
                class="font-medium text-indigo-700 underline underline-offset-2"
              >
                View
              </RouterLink>
              <span v-else>{{ EMPTY }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </ChartCard>
</template>
