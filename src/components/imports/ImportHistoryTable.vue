<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type {
  ImportBatchDetail,
  ImportBatchSummary,
} from '@/types/imports';
import type { PaginationMeta } from '@/types/workouts';
import { formatDate, formatInteger, formatVolume } from '@/utils/format';

const props = defineProps<{
  batches: ImportBatchSummary[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  expandedId: string | null;
  detail: ImportBatchDetail | null;
  isDetailLoading: boolean;
  detailError: string | null;
  deletingId: string | null;
}>();

const emit = defineEmits<{
  retry: [];
  toggle: [id: string];
  requestDelete: [batch: ImportBatchSummary];
  page: [page: number];
}>();

const head = 'px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap';
const cell = 'px-3 py-2 text-sm text-slate-800 whitespace-nowrap';
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white">
    <header class="border-b border-slate-100 px-4 py-3">
      <h2 class="text-sm font-semibold text-slate-900">Import history</h2>
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

    <p v-else-if="props.batches.length === 0" class="p-10 text-center text-sm text-slate-500">
      No imports yet.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse">
        <caption class="sr-only">Import history, newest first</caption>
        <thead class="bg-slate-50">
          <tr>
            <th scope="col" :class="head">Date</th>
            <th scope="col" :class="head">File</th>
            <th scope="col" :class="head">Rows</th>
            <th scope="col" :class="head">Created</th>
            <th scope="col" :class="head">Skipped</th>
            <th scope="col" :class="head">Sets</th>
            <th scope="col" :class="head">Still present</th>
            <th scope="col" :class="head">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="batch in props.batches" :key="batch.id">
            <tr class="border-t border-slate-100 hover:bg-slate-50">
              <td :class="cell">
                <button
                  type="button"
                  class="text-left hover:underline"
                  :aria-expanded="props.expandedId === batch.id"
                  :aria-controls="`batch-detail-${batch.id}`"
                  @click="emit('toggle', batch.id)"
                >
                  <span aria-hidden="true" class="mr-1 text-xs">
                    {{ props.expandedId === batch.id ? '▾' : '▸' }}
                  </span>
                  {{ formatDate(batch.importedAt) }}
                </button>
              </td>
              <th scope="row" :class="[cell, 'max-w-[16rem] truncate text-left font-medium']">
                {{ batch.fileName }}
              </th>
              <td :class="cell">{{ formatInteger(batch.rowCount) }}</td>
              <td :class="cell">{{ formatInteger(batch.workoutsCreated) }}</td>
              <td :class="cell">{{ formatInteger(batch.workoutsSkipped) }}</td>
              <td :class="cell">{{ formatInteger(batch.setsCreated) }}</td>
              <td :class="[cell, batch.workoutsStillPresent === 0 ? 'text-slate-400' : '']">
                {{ formatInteger(batch.workoutsStillPresent) }} / {{ formatInteger(batch.workoutsCreated) }}
              </td>
              <td :class="cell">
                <span
                  :title="
                    batch.rollbackable
                      ? undefined
                      : 'This batch no longer owns any workout, so it cannot be rolled back.'
                  "
                >
                  <button
                    type="button"
                    class="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                    :disabled="!batch.rollbackable || props.deletingId === batch.id"
                    @click="emit('requestDelete', batch)"
                  >
                    Delete
                  </button>
                </span>
              </td>
            </tr>

            <tr v-if="props.expandedId === batch.id" :id="`batch-detail-${batch.id}`">
              <td colspan="8" class="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <div v-if="props.isDetailLoading" class="flex flex-col gap-2" aria-busy="true">
                  <div v-for="row in 3" :key="row" class="h-6 animate-pulse rounded bg-slate-200" />
                </div>

                <p v-else-if="props.detailError" class="text-sm text-red-900" role="alert">
                  {{ props.detailError }}
                </p>

                <p
                  v-else-if="!props.detail || props.detail.workouts.length === 0"
                  class="text-sm text-slate-500"
                >
                  This import has no workouts left.
                </p>

                <ul v-else class="divide-y divide-slate-200">
                  <li
                    v-for="workout in props.detail.workouts"
                    :key="workout.id"
                    class="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 text-sm"
                  >
                    <RouterLink
                      :to="{ name: 'home', query: { tab: 'workouts', workout: workout.id } }"
                      class="truncate font-medium text-indigo-700 underline underline-offset-2"
                    >
                      {{ workout.title }}
                    </RouterLink>
                    <span class="text-xs text-slate-500">
                      {{ formatDate(workout.startedAt) }}
                      <span aria-hidden="true"> · </span>
                      {{ workout.exerciseCount }} exercises
                      <span aria-hidden="true"> · </span>
                      {{ workout.setCount }} sets
                      <span aria-hidden="true"> · </span>
                      {{ formatVolume(workout.totalVolumeKg) }}
                    </span>
                  </li>
                </ul>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <nav
      v-if="props.meta && props.meta.totalPages > 1"
      class="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3"
      aria-label="Import history pagination"
    >
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="props.meta.page <= 1"
        @click="emit('page', props.meta.page - 1)"
      >
        Previous
      </button>
      <p class="text-sm text-slate-600">
        Page {{ props.meta.page }} of {{ props.meta.totalPages }}
      </p>
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
