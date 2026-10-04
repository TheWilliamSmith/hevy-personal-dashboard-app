<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronRight } from 'lucide-vue-next';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { HistoryEntry } from '@/types/exercises';
import { EMPTY, formatDate, formatLoad, formatNumber, formatVolume } from '@/utils/format';
import { SET_TYPE_DOT_CLASSES, SET_TYPE_LABELS } from '@/utils/sets';

defineProps<{
  entries: HistoryEntry[];
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
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
  return `${formatLoad(weightKg)} × ${reps ?? EMPTY}`;
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400';
const head = 'px-2 py-2 text-left text-[11px] font-medium text-zinc-500';
const cell = 'px-2 py-2 text-sm text-zinc-100 tabular-nums';
</script>

<template>
  <section class="flex flex-col gap-2">
    <SectionHeader :title="t('exercises.history.title')" :subtitle="t('exercises.history.subtitle', { count: total })" />

    <EmptyState v-if="entries.length === 0" :message="t('exercises.history.none')" />

    <ul v-else>
      <li v-for="entry in entries" :key="entry.workoutId" class="border-b border-zinc-800 last:border-b-0">
        <button
          type="button"
          class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-3 text-left transition-colors hover:bg-zinc-900 lg:grid-cols-[auto_minmax(0,1fr)_9rem_7rem]"
          :class="focus"
          :aria-expanded="expanded.has(entry.workoutId)"
          :aria-controls="`session-${entry.workoutId}`"
          @click="toggle(entry.workoutId)"
        >
          <ChevronRight
            class="h-4 w-4 text-zinc-500 transition-transform"
            :class="{ 'rotate-90': expanded.has(entry.workoutId) }"
            aria-hidden="true"
          />
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-zinc-100">{{ entry.workoutTitle }}</span>
            <time :datetime="entry.date" class="block text-[11px] text-zinc-500">{{ formatDate(entry.date) }}</time>
          </span>
          <span class="hidden flex-col lg:flex">
            <span class="text-sm text-zinc-100 tabular-nums">{{ bestSetSummary(entry) }}</span>
            <span class="text-[11px] text-zinc-500">{{ t('exercises.history.bestSet') }}</span>
          </span>
          <span class="flex flex-col text-right lg:text-left">
            <span class="text-sm text-zinc-100 tabular-nums">{{ formatVolume(entry.sessionVolumeKg) }}</span>
            <span class="text-[11px] text-zinc-500">{{ t('exercises.history.volume') }}</span>
          </span>
        </button>

        <div
          v-if="expanded.has(entry.workoutId)"
          :id="`session-${entry.workoutId}`"
          class="mb-3 ml-7 flex flex-col gap-2 rounded-md bg-zinc-900 px-4 py-3"
        >
          <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <RouterLink
              :to="{ name: 'home', query: { tab: 'workouts', workout: entry.workoutId } }"
              class="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
            >
              {{ t('exercises.history.openWorkout') }}
            </RouterLink>
            <span v-if="entry.supersetId !== null" class="flex items-center gap-1 text-sky-400">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
              Superset {{ entry.supersetId }}
            </span>
            <span v-if="entry.notes">{{ entry.notes }}</span>
          </p>

          <table class="w-full border-collapse">
            <caption class="sr-only">{{ t('exercises.history.setsFor', { name: entry.workoutTitle }) }}</caption>
            <thead>
              <tr class="border-b border-zinc-800">
                <th scope="col" :class="head">{{ t('exercises.history.set') }}</th>
                <th scope="col" :class="head">{{ t('exercises.history.type') }}</th>
                <th scope="col" :class="head">{{ t('exercises.history.weightReps') }}</th>
                <th scope="col" :class="head">{{ t('exercises.history.volume') }}</th>
                <th scope="col" :class="head">{{ t('exercises.history.est1RM') }}</th>
                <th scope="col" :class="head">{{ t('exercises.history.rpe') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="set in entry.sets"
                :key="set.setIndex"
                class="border-b border-zinc-800/60 last:border-b-0"
                :class="set.isPR ? 'bg-emerald-400/10' : ''"
              >
                <th scope="row" :class="[cell, 'text-left font-normal text-zinc-400']">
                  {{ set.setIndex + 1 }}
                  <span v-if="set.isPR" class="ml-1 text-[11px] font-medium text-emerald-400">
                    {{ t('exercises.history.pr') }}<span class="sr-only">{{ t('exercises.history.prSet') }}</span>
                  </span>
                </th>
                <td :class="cell">
                  <span class="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span class="h-1.5 w-1.5 rounded-full" :class="SET_TYPE_DOT_CLASSES[set.setType]" aria-hidden="true" />
                    {{ SET_TYPE_LABELS[set.setType] }}
                  </span>
                </td>
                <td :class="cell">
                  <template v-if="set.weightKg === null && set.reps === null">{{ EMPTY }}</template>
                  <template v-else>{{ formatLoad(set.weightKg) }} × {{ set.reps ?? EMPTY }}</template>
                </td>
                <td :class="cell">{{ set.volumeKg === null ? EMPTY : formatVolume(set.volumeKg) }}</td>
                <td :class="cell">{{ set.est1RM === null ? EMPTY : formatLoad(set.est1RM) }}</td>
                <td :class="[cell, 'text-zinc-400']">{{ formatNumber(set.rpe) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </li>
    </ul>

    <button
      v-if="hasMore"
      type="button"
      class="self-center rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50"
      :class="focus"
      :disabled="isLoadingMore"
      :aria-busy="isLoadingMore"
      @click="emit('loadMore')"
    >
      {{ isLoadingMore ? t('exercises.history.loading') : t('exercises.history.loadMore') }}
    </button>
  </section>
</template>
