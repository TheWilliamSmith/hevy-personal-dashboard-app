<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { ImportBatchDetail, ImportBatchSummary } from '@/types/imports';
import type { PaginationMeta } from '@/types/workouts';
import { formatDate, formatInteger, formatVolume } from '@/utils/format';

defineProps<{
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

function statsOf(batch: ImportBatchSummary) {
  return [
    { label: 'Rows', value: formatInteger(batch.rowCount) },
    { label: 'Created', value: formatInteger(batch.workoutsCreated) },
    { label: 'Skipped', value: formatInteger(batch.workoutsSkipped) },
    { label: 'Sets', value: formatInteger(batch.setsCreated) },
    {
      label: 'Still present',
      value: `${formatInteger(batch.workoutsStillPresent)} / ${formatInteger(batch.workoutsCreated)}`,
    },
  ];
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400';
</script>

<template>
  <section class="flex flex-col gap-2">
    <SectionHeader title="Import history" :subtitle="meta ? `${meta.total} imports · newest first` : 'Newest first'" />

    <ul v-if="isLoading && batches.length === 0" class="flex flex-col gap-3 pt-2" aria-busy="true">
      <li v-for="row in 4" :key="row" class="h-12 animate-pulse rounded-md bg-zinc-900" />
    </ul>

    <SectionError v-else-if="error" :message="error" @retry="emit('retry')" />

    <EmptyState v-else-if="batches.length === 0" message="No imports yet." />

    <ul v-else>
      <li v-for="batch in batches" :key="batch.id" class="border-b border-zinc-800 last:border-b-0">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="grid min-w-0 flex-1 grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-zinc-900 lg:grid-cols-[1rem_minmax(0,1.5fr)_repeat(5,5.5rem)]"
            :class="focus"
            :aria-expanded="expandedId === batch.id"
            :aria-controls="`batch-detail-${batch.id}`"
            @click="emit('toggle', batch.id)"
          >
            <ChevronRight
              class="h-4 w-4 text-zinc-500 transition-transform"
              :class="{ 'rotate-90': expandedId === batch.id }"
              aria-hidden="true"
            />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-zinc-100">{{ batch.fileName }}</span>
              <span class="block text-[11px] text-zinc-500">
                {{ formatDate(batch.importedAt) }}
                <span class="lg:hidden">
                  · {{ formatInteger(batch.workoutsCreated) }} workouts, {{ formatInteger(batch.setsCreated) }} sets
                </span>
              </span>
            </span>
            <span v-for="stat in statsOf(batch)" :key="stat.label" class="hidden flex-col lg:flex">
              <span
                class="text-sm tabular-nums"
                :class="stat.label === 'Still present' && batch.workoutsStillPresent === 0 ? 'text-zinc-600' : 'text-zinc-100'"
              >
                {{ stat.value }}
              </span>
              <span class="text-[11px] text-zinc-500">{{ stat.label }}</span>
            </span>
          </button>

          <span
            class="shrink-0"
            :title="batch.rollbackable ? undefined : 'This batch no longer owns any workout, so it cannot be rolled back.'"
          >
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-zinc-800 hover:text-red-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-zinc-900"
              :class="focus"
              :disabled="!batch.rollbackable || deletingId === batch.id"
              @click="emit('requestDelete', batch)"
            >
              Delete
            </button>
          </span>
        </div>

        <div
          v-if="expandedId === batch.id"
          :id="`batch-detail-${batch.id}`"
          class="mb-3 ml-7 rounded-md bg-zinc-900 px-4 py-3"
        >
          <div v-if="isDetailLoading" class="flex flex-col gap-2" aria-busy="true">
            <div v-for="row in 3" :key="row" class="h-6 animate-pulse rounded bg-zinc-800" />
          </div>

          <p v-else-if="detailError" class="text-sm text-red-300" role="alert">{{ detailError }}</p>

          <p v-else-if="!detail || detail.workouts.length === 0" class="text-sm text-zinc-500">
            This import has no workouts left.
          </p>

          <ul v-else class="divide-y divide-zinc-800">
            <li
              v-for="workout in detail.workouts"
              :key="workout.id"
              class="flex flex-wrap items-baseline justify-between gap-x-4 py-2 text-sm"
            >
              <RouterLink
                :to="{ name: 'home', query: { tab: 'workouts', workout: workout.id } }"
                class="truncate font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
              >
                {{ workout.title }}
              </RouterLink>
              <span class="text-xs text-zinc-500">
                {{ formatDate(workout.startedAt) }} · {{ workout.exerciseCount }} exercises ·
                {{ workout.setCount }} sets · {{ formatVolume(workout.totalVolumeKg) }}
              </span>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <Pagination
      v-if="meta && meta.totalPages > 1"
      class="pt-2"
      :meta="meta"
      label="Import history pagination"
      unit="imports"
      @change="emit('page', $event)"
    />
  </section>
</template>
