<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { HevySyncRun } from '@/types/hevy';
import type { PaginationMeta } from '@/types/workouts';
import { formatDate, formatDuration, formatInteger } from '@/utils/format';

const props = defineProps<{
  runs: HevySyncRun[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  expandedId: string | null;
}>();

const emit = defineEmits<{ retry: []; toggle: [id: string]; page: [page: number] }>();

const head = 'px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap';
const cell = 'px-3 py-2 text-sm text-slate-800 whitespace-nowrap';

const TRIGGER_LABELS: Readonly<Record<string, string>> = {
  MANUAL: 'Manual',
  SCHEDULED: 'Scheduled',
  AFTER_CONNECT: 'After connect',
};

const STATUS_STYLES: Readonly<Record<string, string>> = {
  RUNNING: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PARTIAL: 'bg-amber-50 text-amber-800 ring-amber-200',
  FAILED: 'bg-red-50 text-red-700 ring-red-200',
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  RUNNING: 'Running',
  SUCCESS: 'Succeeded',
  PARTIAL: 'Partial',
  FAILED: 'Failed',
};
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white">
    <header class="border-b border-slate-100 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-900">Sync history</h3>
    </header>

    <div v-if="props.isLoading" class="flex flex-col gap-2 p-4" aria-busy="true">
      <div v-for="row in 4" :key="row" class="h-10 animate-pulse rounded bg-slate-100" />
    </div>

    <div v-else-if="props.error" class="p-6 text-center" role="alert">
      <p class="text-sm text-red-900">{{ props.error }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>

    <p v-else-if="props.runs.length === 0" class="p-10 text-center text-sm text-slate-500">
      No syncs yet.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse">
        <caption class="sr-only">Hevy sync history, newest first</caption>
        <thead class="bg-slate-50">
          <tr>
            <th scope="col" :class="head">Date</th>
            <th scope="col" :class="head">Trigger</th>
            <th scope="col" :class="head">Duration</th>
            <th scope="col" :class="head">Status</th>
            <th scope="col" :class="head">Created</th>
            <th scope="col" :class="head">Updated</th>
            <th scope="col" :class="head">Deleted</th>
            <th scope="col" :class="head">Matched</th>
            <th scope="col" :class="head">Requests</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="run in props.runs" :key="run.id">
            <tr class="border-t border-slate-100 hover:bg-slate-50">
              <td :class="cell">
                <button
                  type="button"
                  class="text-left hover:underline"
                  :aria-expanded="props.expandedId === run.id"
                  :aria-controls="`run-detail-${run.id}`"
                  @click="emit('toggle', run.id)"
                >
                  <span aria-hidden="true" class="mr-1 text-xs">
                    {{ props.expandedId === run.id ? '▾' : '▸' }}
                  </span>
                  {{ formatDate(run.startedAt) }}
                </button>
              </td>
              <td :class="cell">{{ TRIGGER_LABELS[run.trigger] ?? run.trigger }}</td>
              <td :class="cell">{{ formatDuration(run.durationSec) }}</td>
              <td :class="cell">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                  :class="STATUS_STYLES[run.status]"
                >
                  {{ STATUS_LABELS[run.status] ?? run.status }}
                </span>
              </td>
              <td :class="cell">{{ formatInteger(run.workoutsCreated) }}</td>
              <td :class="cell">{{ formatInteger(run.workoutsUpdated) }}</td>
              <td :class="cell">{{ formatInteger(run.workoutsDeleted) }}</td>
              <td :class="cell">{{ formatInteger(run.workoutsMatched) }}</td>
              <td :class="cell">{{ formatInteger(run.requestCount) }}</td>
            </tr>

            <tr
              v-if="props.expandedId === run.id && (run.errorMessage || run.flaggedExercises.length > 0)"
              :id="`run-detail-${run.id}`"
            >
              <td colspan="9" class="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <p v-if="run.errorMessage" class="text-sm text-red-900" role="alert">
                  {{ run.errorMessage }}
                </p>

                <div v-if="run.flaggedExercises.length > 0" :class="run.errorMessage ? 'mt-3' : ''">
                  <p class="text-xs font-medium text-slate-600">
                    Needs review — unknown muscle group
                  </p>
                  <ul class="mt-1 flex flex-wrap gap-2">
                    <li v-for="exercise in run.flaggedExercises" :key="exercise.externalKey">
                      <RouterLink
                        :to="{ name: 'home', query: { tab: 'exercises', q: exercise.name } }"
                        class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                      >
                        {{ exercise.name }}
                      </RouterLink>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <nav
      v-if="props.meta && props.meta.totalPages > 1"
      class="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3"
      aria-label="Sync history pagination"
    >
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="props.meta.page <= 1"
        @click="emit('page', props.meta.page - 1)"
      >
        Previous
      </button>
      <p class="text-sm text-slate-600">Page {{ props.meta.page }} of {{ props.meta.totalPages }}</p>
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="props.meta.page >= props.meta.totalPages"
        @click="emit('page', props.meta.page + 1)"
      >
        Next
      </button>
    </nav>
  </section>
</template>
