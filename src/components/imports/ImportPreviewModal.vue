<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type DeepReadonly } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import type { ExistingWorkoutRef, ImportPreview, StagedWorkoutPreview } from '@/types/imports';
import { formatDate, formatDuration, formatInteger, formatVolume } from '@/utils/format';

const props = defineProps<{
  preview: DeepReadonly<ImportPreview> | null;
  isConfirming: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ cancel: []; confirm: []; reupload: [] }>();

const PAGE_SIZE = 50;

const showNew = ref(true);
const showExisting = ref(false);
const newPage = ref(1);
const existingPage = ref(1);
const dismissedWarnings = ref(false);

const open = computed(() => props.preview !== null);

const summary = computed(() => props.preview?.summary ?? null);
const newWorkouts = computed<readonly DeepReadonly<StagedWorkoutPreview>[]>(
  () => props.preview?.newWorkoutsPreview ?? [],
);
const existing = computed<readonly DeepReadonly<ExistingWorkoutRef>[]>(
  () => props.preview?.existingWorkouts ?? [],
);
const warnings = computed(() => props.preview?.warnings ?? []);

const nothingToImport = computed(() => (summary.value?.newWorkouts ?? 0) === 0);

function paged<T>(rows: readonly T[], page: number): T[] {
  const start = (page - 1) * PAGE_SIZE;
  return rows.slice(start, start + PAGE_SIZE);
}

const pagedNew = computed(() => paged(newWorkouts.value, newPage.value));
const pagedExisting = computed(() => paged(existing.value, existingPage.value));
const newPages = computed(() => Math.max(1, Math.ceil(newWorkouts.value.length / PAGE_SIZE)));
const existingPages = computed(() => Math.max(1, Math.ceil(existing.value.length / PAGE_SIZE)));

const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;

watch(
  open,
  (isOpen) => {
    if (ticker) {
      clearInterval(ticker);
      ticker = null;
    }
    if (isOpen) {
      now.value = Date.now();
      ticker = setInterval(() => (now.value = Date.now()), 1000);
      newPage.value = 1;
      existingPage.value = 1;
      dismissedWarnings.value = false;
      showNew.value = true;
      showExisting.value = false;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (ticker) {
    clearInterval(ticker);
  }
});

const msLeft = computed(() => {
  if (!props.preview) {
    return 0;
  }
  return Math.max(0, Date.parse(props.preview.expiresAt) - now.value);
});

const hasExpired = computed(() => msLeft.value === 0);

const countdown = computed(() => {
  const totalSeconds = Math.floor(msLeft.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});

const canConfirm = computed(
  () => !props.isConfirming && !nothingToImport.value && !hasExpired.value,
);

const tile = 'flex flex-col gap-0.5 px-4 py-3';
</script>

<template>
  <BaseDialog
    :open="open"
    labelled-by="import-preview-title"
    :locked="props.isConfirming"
    @close="emit('cancel')"
  >
    <header class="border-b border-zinc-800 px-5 py-4">
      <h2 id="import-preview-title" class="text-base font-semibold text-white">
        Review import
      </h2>
      <p class="mt-0.5 truncate text-sm text-zinc-500">
        {{ props.preview?.fileName }}
        <span aria-hidden="true"> · </span>
        {{ formatInteger(props.preview?.rowsParsed ?? 0) }} rows parsed
      </p>

      <p
        v-if="props.preview?.alreadyImportedFile"
        class="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
      >
        You already imported this exact file. Confirming again will only add workouts that are
        still missing.
      </p>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="warnings.length > 0 && !dismissedWarnings"
        class="border-b border-amber-500/30 bg-amber-500/10 px-5 py-3"
        role="alert"
      >
        <div class="flex items-start gap-3">
          <ul class="min-w-0 flex-1 list-disc space-y-1 pl-4 text-sm text-amber-200">
            <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
          </ul>
          <button
            type="button"
            class="shrink-0 text-xs font-medium text-amber-300 underline underline-offset-2"
            @click="dismissedWarnings = true"
          >
            Dismiss
          </button>
        </div>
      </div>

      <dl class="grid grid-cols-3 border-b border-zinc-800">
        <div :class="tile">
          <dt class="text-xs text-zinc-500">New workouts</dt>
          <dd class="text-2xl font-semibold text-white tabular-nums">
            {{ formatInteger(summary?.newWorkouts ?? 0) }}
          </dd>
        </div>
        <div :class="tile">
          <dt class="text-xs text-zinc-500">Already present</dt>
          <dd class="text-2xl font-semibold text-zinc-500 tabular-nums">
            {{ formatInteger(summary?.existingWorkouts ?? 0) }}
          </dd>
        </div>
        <div :class="tile">
          <dt class="text-xs text-zinc-500">New sets</dt>
          <dd class="text-2xl font-semibold text-white tabular-nums">
            {{ formatInteger(summary?.newSets ?? 0) }}
          </dd>
        </div>
      </dl>

      <p v-if="nothingToImport" class="px-5 py-4 text-sm text-zinc-400">
        Nothing to import — every workout in this file is already in your data.
      </p>

      <section v-if="newWorkouts.length > 0" class="border-b border-zinc-800">
        <h3>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-zinc-100 hover:bg-zinc-800/60"
            :aria-expanded="showNew"
            @click="showNew = !showNew"
          >
            <span aria-hidden="true" class="text-xs">{{ showNew ? '▾' : '▸' }}</span>
            New workouts ({{ formatInteger(newWorkouts.length) }})
          </button>
        </h3>

        <div v-if="showNew" class="px-5 pb-4">
          <ul class="flex flex-col">
            <li
              v-for="workout in pagedNew"
              :key="workout.externalKey"
              class="border-b border-zinc-800 py-3 last:border-b-0"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="truncate text-sm font-medium text-zinc-100">{{ workout.title }}</p>
                <time :datetime="workout.startedAt" class="text-xs text-zinc-500">
                  {{ formatDate(workout.startedAt) }}
                </time>
              </div>
              <p class="mt-1 flex flex-wrap gap-x-4 text-xs text-zinc-400">
                <span>{{ formatDuration(workout.durationSec) }}</span>
                <span>{{ workout.exerciseCount }} exercises</span>
                <span>{{ workout.setCount }} sets</span>
                <span>{{ formatVolume(workout.totalVolumeKg) }}</span>
              </p>
              <ul v-if="workout.exerciseNames.length" class="mt-2 flex flex-wrap gap-1">
                <li
                  v-for="name in workout.exerciseNames"
                  :key="name"
                  class="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  {{ name }}
                </li>
              </ul>
            </li>
          </ul>

          <nav
            v-if="newPages > 1"
            class="mt-3 flex items-center justify-between text-xs"
            aria-label="New workouts pages"
          >
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              :disabled="newPage <= 1"
              @click="newPage -= 1"
            >
              Previous
            </button>
            <span class="text-zinc-500">Page {{ newPage }} of {{ newPages }}</span>
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              :disabled="newPage >= newPages"
              @click="newPage += 1"
            >
              Next
            </button>
          </nav>
        </div>
      </section>

      <section v-if="existing.length > 0">
        <h3>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-zinc-100 hover:bg-zinc-800/60"
            :aria-expanded="showExisting"
            @click="showExisting = !showExisting"
          >
            <span aria-hidden="true" class="text-xs">{{ showExisting ? '▾' : '▸' }}</span>
            Already present ({{ formatInteger(existing.length) }})
          </button>
        </h3>

        <div v-if="showExisting" class="px-5 pb-4">
          <ul class="divide-y divide-zinc-800">
            <li
              v-for="workout in pagedExisting"
              :key="workout.externalKey"
              class="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 text-xs"
            >
              <span class="truncate text-zinc-200">{{ workout.title }}</span>
              <span class="text-zinc-500">
                {{ formatDate(workout.startedAt) }}
                <span aria-hidden="true"> · </span>
                imported {{ formatDate(workout.importedAt) }}
              </span>
            </li>
          </ul>

          <nav
            v-if="existingPages > 1"
            class="mt-3 flex items-center justify-between text-xs"
            aria-label="Already present pages"
          >
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              :disabled="existingPage <= 1"
              @click="existingPage -= 1"
            >
              Previous
            </button>
            <span class="text-zinc-500">Page {{ existingPage }} of {{ existingPages }}</span>
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              :disabled="existingPage >= existingPages"
              @click="existingPage += 1"
            >
              Next
            </button>
          </nav>
        </div>
      </section>
    </div>

    <footer class="flex flex-wrap items-center gap-3 border-t border-zinc-800 px-5 py-4">
      <p v-if="hasExpired" class="mr-auto text-xs text-red-400">
        This preview expired. Upload the file again.
      </p>
      <p v-else class="mr-auto text-xs text-zinc-500">
        Expires in <span class="font-medium tabular-nums">{{ countdown }}</span>
      </p>

      <p v-if="props.error" class="w-full text-sm text-red-400" role="alert">{{ props.error }}</p>

      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :disabled="props.isConfirming"
        @click="emit('cancel')"
      >
        Cancel
      </button>

      <button
        v-if="hasExpired"
        type="button"
        class="rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        @click="emit('reupload')"
      >
        Re-upload the file
      </button>

      <button
        v-else
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canConfirm"
        :aria-busy="props.isConfirming"
        @click="emit('confirm')"
      >
        <span
          v-if="props.isConfirming"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
        Import {{ formatInteger(summary?.newWorkouts ?? 0) }} workouts
      </button>
    </footer>
  </BaseDialog>
</template>
