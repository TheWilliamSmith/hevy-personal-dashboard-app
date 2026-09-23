<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import SetTypeBadge from '@/components/workouts/SetTypeBadge.vue';
import type { HistoryEntry } from '@/types/exercises';
import { EMPTY, formatDate, formatNumber, formatVolume, formatWeight } from '@/utils/format';

const props = defineProps<{
  entries: HistoryEntry[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{ loadMore: [] }>();

const expanded = ref<Set<string>>(new Set());

function toggle(workoutId: string): void {
  const next = new Set(expanded.value);
  if (next.has(workoutId)) {
    next.delete(workoutId);
  } else {
    next.add(workoutId);
  }
  expanded.value = next;
}

function bestSetSummary(entry: HistoryEntry): string {
  if (!entry.bestSet) {
    return EMPTY;
  }
  const { weightKg, reps } = entry.bestSet;
  if (weightKg === null && reps === null) {
    return formatVolume(entry.bestSet.volumeKg);
  }
  return `${formatWeight(weightKg)} kg × ${reps ?? EMPTY}`;
}

const head = 'px-3 py-2 text-left text-xs font-semibold text-slate-600';
const cell = 'px-3 py-2 text-sm text-slate-800';
</script>

<template>
  <section class="border-t border-slate-200 bg-white">
    <header class="border-b border-slate-100 px-4 py-3">
      <h2 class="text-sm font-semibold text-slate-900">Session history</h2>
    </header>

    <div v-if="props.isLoading" class="flex flex-col gap-2 p-4" aria-busy="true">
      <div v-for="row in 4" :key="row" class="h-12 animate-pulse rounded bg-slate-100" />
    </div>

    <p v-else-if="props.entries.length === 0" class="p-10 text-center text-sm text-slate-500">
      No sessions recorded for this exercise.
    </p>

    <ul v-else class="divide-y divide-slate-100">
      <li v-for="entry in props.entries" :key="entry.workoutId">
        <button
          type="button"
          class="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-slate-50"
          :aria-expanded="expanded.has(entry.workoutId)"
          :aria-controls="`session-${entry.workoutId}`"
          @click="toggle(entry.workoutId)"
        >
          <span aria-hidden="true" class="text-xs text-slate-400">
            {{ expanded.has(entry.workoutId) ? '▾' : '▸' }}
          </span>
          <time :datetime="entry.date" class="text-sm font-medium text-slate-900">
            {{ formatDate(entry.date) }}
          </time>
          <span class="min-w-0 flex-1 truncate text-sm text-slate-600">{{ entry.workoutTitle }}</span>
          <span class="text-xs text-slate-500">Best {{ bestSetSummary(entry) }}</span>
          <span class="text-xs font-medium text-slate-700">
            {{ formatVolume(entry.sessionVolumeKg) }}
          </span>
        </button>

        <div v-if="expanded.has(entry.workoutId)" :id="`session-${entry.workoutId}`" class="px-4 pb-4">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <RouterLink
              :to="{ name: 'home', query: { tab: 'workouts', workout: entry.workoutId } }"
              class="text-xs font-medium text-indigo-700 underline underline-offset-2"
            >
              Open workout
            </RouterLink>
            <span
              v-if="entry.supersetId !== null"
              class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800 ring-1 ring-sky-200 ring-inset"
            >
              Superset {{ entry.supersetId }}
            </span>
          </div>

          <p v-if="entry.notes" class="mb-2 text-xs text-slate-600">{{ entry.notes }}</p>

          <table class="w-full border-collapse">
            <caption class="sr-only">Sets for {{ entry.workoutTitle }}</caption>
            <thead class="bg-slate-50">
              <tr>
                <th scope="col" :class="head">Set</th>
                <th scope="col" :class="head">Type</th>
                <th scope="col" :class="head">Weight × reps</th>
                <th scope="col" :class="head">Volume</th>
                <th scope="col" :class="head">Est. 1RM</th>
                <th scope="col" :class="head">RPE</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="set in entry.sets"
                :key="set.setIndex"
                class="border-t border-slate-100"
                :class="set.isPR ? 'bg-emerald-50' : ''"
              >
                <th scope="row" :class="[cell, 'text-left font-medium']">
                  {{ set.setIndex + 1 }}
                  <span v-if="set.isPR" class="ml-1 text-xs font-semibold text-emerald-700">
                    PR<span class="sr-only"> — personal record set</span>
                  </span>
                </th>
                <td :class="cell"><SetTypeBadge :type="set.setType" /></td>
                <td :class="cell">
                  <template v-if="set.weightKg === null && set.reps === null">{{ EMPTY }}</template>
                  <template v-else>{{ formatWeight(set.weightKg) }} kg × {{ set.reps ?? EMPTY }}</template>
                </td>
                <td :class="cell">{{ set.volumeKg === null ? EMPTY : formatVolume(set.volumeKg) }}</td>
                <td :class="cell">
                  {{ set.est1RM === null ? EMPTY : `${formatWeight(set.est1RM)} kg` }}
                </td>
                <td :class="cell">{{ formatNumber(set.rpe) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </li>
    </ul>

    <div v-if="props.hasMore" class="border-t border-slate-100 p-3 text-center">
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        :disabled="props.isLoadingMore"
        :aria-busy="props.isLoadingMore"
        @click="emit('loadMore')"
      >
        {{ props.isLoadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </section>
</template>
