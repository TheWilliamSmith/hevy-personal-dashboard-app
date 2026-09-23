<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import ProgressRow from '@/components/progress/ProgressRow.vue';
import ProgressSettings from '@/components/progress/ProgressSettings.vue';
import StatusStrip from '@/components/progress/StatusStrip.vue';
import { useProgressAlerts, type ProgressSort } from '@/composables/useProgressAlerts';
import { useToasts } from '@/composables/useToasts';
import { STATUS_STYLES } from '@/constants/progress';
import MuteButton from '@/components/progress/MuteButton.vue';
import type { MutedExercise, ProgressItem } from '@/types/progress';

const progress = useProgressAlerts();
const { push } = useToasts();

const showMuted = ref(false);

const SORTS: ReadonlyArray<{ value: ProgressSort; label: string }> = [
  { value: 'priority', label: 'Priority' },
  { value: 'slope', label: 'Slope (worst first)' },
  { value: 'gap', label: 'Gap to best' },
  { value: 'lastPR', label: 'Longest since PR' },
  { value: 'lastDone', label: 'Longest since done' },
  { value: 'name', label: 'Name' },
];

/** Nothing tracked at all — not the same as "this filter matches nothing". */
const isGloballyEmpty = computed(
  () =>
    progress.hasLoaded.value && progress.total.value === 0 && progress.muted.value.length === 0,
);

const emptyMessage = computed(() =>
  progress.status.value
    ? STATUS_STYLES[progress.status.value].empty
    : 'No exercises match these settings.',
);

async function mute(item: ProgressItem, reason: string | null): Promise<void> {
  if (!(await progress.mute(item, reason))) {
    push({ tone: 'error', title: `Could not mute ${item.name}`, description: progress.muteError.value ?? undefined });
  }
}

async function unmute(entry: MutedExercise): Promise<void> {
  if (!(await progress.unmute(entry))) {
    push({ tone: 'error', title: `Could not unmute ${entry.name}`, description: progress.muteError.value ?? undefined });
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 px-4 sm:px-6">
    <div
      v-if="isGloballyEmpty"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center"
    >
      <p class="text-slate-700">No training history to assess yet.</p>
      <RouterLink
        :to="{ name: 'home', query: { tab: 'imports' } }"
        aria-current-value="false"
        class="mt-3 inline-block text-sm font-medium text-indigo-700 underline underline-offset-2"
      >
        Import your Hevy export
      </RouterLink>
    </div>

    <template v-else>
      <StatusStrip
        :counts="progress.counts.value"
        :total="progress.total.value"
        :active="progress.status.value"
        :is-loading="progress.isLoading.value"
        @select="progress.setStatus"
      />

      <ProgressSettings
        :draft="progress.draft"
        :counts="progress.counts.value"
        :total="progress.total.value"
        :is-default="progress.isDefault.value"
        :is-loading="progress.isLoading.value"
        @change="progress.updateDraft"
        @reset="progress.resetDefaults"
      />

      <section class="rounded-xl border border-slate-200 bg-white">
        <header class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2">
          <h2 class="text-sm font-semibold text-slate-900">
            {{ progress.status.value ? STATUS_STYLES[progress.status.value].label : 'All exercises' }}
            <span class="font-normal text-slate-500">({{ progress.visible.value.length }})</span>
          </h2>
          <label class="ml-auto flex items-center gap-2 text-xs text-slate-600">
            Sort
            <select
              class="rounded-lg border border-slate-300 px-2 py-1 text-xs"
              :value="progress.sort.value"
              @change="progress.setSort(($event.target as HTMLSelectElement).value as ProgressSort)"
            >
              <option v-for="option in SORTS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </header>

        <div v-if="progress.error.value" class="p-6 text-center" role="alert">
          <p class="text-sm text-red-900">{{ progress.error.value }}</p>
          <button
            type="button"
            class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="progress.refresh"
          >
            Retry
          </button>
        </div>

        <!-- Skeleton rows only on the first load; later refetches keep the list. -->
        <ul v-else-if="!progress.hasLoaded.value" aria-busy="true">
          <li v-for="row in 8" :key="row" class="flex items-center gap-4 border-b border-slate-100 px-4 py-3">
            <div class="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
            <div class="h-4 w-48 animate-pulse rounded bg-slate-200" />
            <div class="ml-auto hidden h-6 w-28 animate-pulse rounded bg-slate-100 lg:block" />
            <div class="hidden h-4 w-24 animate-pulse rounded bg-slate-100 lg:block" />
          </li>
        </ul>

        <p v-else-if="progress.visible.value.length === 0" class="p-10 text-center text-sm text-slate-500">
          {{ emptyMessage }}
        </p>

        <ul v-else :aria-busy="progress.isLoading.value">
          <ProgressRow
            v-for="alert in progress.visible.value"
            :key="alert.exerciseId"
            :alert="alert"
            :busy="progress.mutingId.value === alert.exerciseId"
            @mute="(reason) => mute(alert, reason)"
          />
        </ul>
      </section>

      <section v-if="progress.muted.value.length > 0" class="mb-4 rounded-xl border border-slate-200 bg-white">
        <h2>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-slate-700"
            :aria-expanded="showMuted"
            aria-controls="progress-muted"
            @click="showMuted = !showMuted"
          >
            <span aria-hidden="true" class="text-xs text-slate-400">{{ showMuted ? '▾' : '▸' }}</span>
            Muted ({{ progress.muted.value.length }})
          </button>
        </h2>
        <!-- The API returns muted exercises in a short shape: no status, no series. -->
        <ul v-if="showMuted" id="progress-muted" class="divide-y divide-slate-100 border-t border-slate-100">
          <li
            v-for="entry in progress.muted.value"
            :key="entry.exerciseId"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2"
          >
            <span class="text-sm font-medium text-slate-700">{{ entry.name }}</span>
            <span class="min-w-0 flex-1 truncate text-xs text-slate-500">
              {{ entry.muteReason ?? 'No reason given' }}
            </span>
            <RouterLink
              :to="{ name: 'home', query: { tab: 'exercises', exercise: entry.slug } }"
              aria-current-value="false"
              class="rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
              :aria-label="`Open ${entry.name} in Exercises`"
            >
              Open
            </RouterLink>
            <MuteButton
              :exercise-id="entry.exerciseId"
              :exercise-name="entry.name"
              :muted="true"
              :busy="progress.mutingId.value === entry.exerciseId"
              @unmute="unmute(entry)"
            />
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
