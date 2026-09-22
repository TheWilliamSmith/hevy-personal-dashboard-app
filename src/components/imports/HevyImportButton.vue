<script setup lang="ts">
import { computed, ref } from 'vue';

import { useHevyImport } from '@/composables/useHevyImport';
import type { ImportResult } from '@/types/imports';

const emit = defineEmits<{ imported: [result: ImportResult] }>();

const { status, file, error, result, progress, selectFile, upload, reset } = useHevyImport();

const input = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const isUploading = computed(() => status.value === 'uploading');

const buttonLabel = computed(() => {
  switch (status.value) {
    case 'uploading':
      return `Uploading… ${progress.value}%`;
    case 'selected':
      return 'Start import';
    default:
      return 'Import Hevy export';
  }
});

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  return kilobytes < 1024 ? `${kilobytes.toFixed(0)} KB` : `${(kilobytes / 1024).toFixed(1)} MB`;
}

/** Clearing the value makes re-picking the same file fire @change again. */
function clearInput(): void {
  if (input.value) {
    input.value.value = '';
  }
}

function openPicker(): void {
  if (isUploading.value) {
    return;
  }

  clearInput();
  input.value?.click();
}

function onChange(event: Event): void {
  selectFile((event.target as HTMLInputElement).files?.[0]);
}

function onDrop(event: DragEvent): void {
  isDragging.value = false;

  if (isUploading.value) {
    return;
  }

  clearInput();
  selectFile(event.dataTransfer?.files?.[0]);
}

async function onPrimaryAction(): Promise<void> {
  if (status.value === 'selected') {
    const imported = await upload();
    if (imported) {
      emit('imported', imported);
    }
    return;
  }

  openPicker();
}

function tryAgain(): void {
  clearInput();
  reset();
}
</script>

<template>
  <section class="w-full max-w-md">
    <div
      class="rounded-xl border-2 border-dashed p-6 text-center transition-colors"
      :class="
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-300 bg-white hover:border-slate-400'
      "
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="input"
        type="file"
        accept=".csv,text/csv"
        aria-label="Hevy CSV export file"
        class="hidden"
        @change="onChange"
      />

      <p class="text-sm text-slate-600">Drop your Hevy CSV export here, or</p>

      <button
        type="button"
        class="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isUploading"
        :aria-busy="isUploading"
        @click="onPrimaryAction"
      >
        {{ buttonLabel }}
      </button>

      <p v-if="file" class="mt-3 truncate text-sm text-slate-700">
        {{ file.name }} — {{ formatSize(file.size) }}
      </p>

      <div
        v-if="isUploading"
        class="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Upload progress"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full bg-indigo-600 transition-[width] duration-150"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <div
      v-if="status === 'success' && result"
      class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
      role="status"
    >
      <p v-if="result.alreadyImported" class="text-sm font-medium text-emerald-900">
        This file was already imported.
      </p>

      <template v-else>
        <p class="text-sm font-medium text-emerald-900">Import complete.</p>
        <dl class="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <dt class="text-xs text-emerald-700">Workouts created</dt>
            <dd class="text-lg font-semibold text-emerald-900">{{ result.workoutsCreated }}</dd>
          </div>
          <div>
            <dt class="text-xs text-emerald-700">Workouts skipped</dt>
            <dd class="text-lg font-semibold text-emerald-900">{{ result.workoutsSkipped }}</dd>
          </div>
          <div>
            <dt class="text-xs text-emerald-700">Sets created</dt>
            <dd class="text-lg font-semibold text-emerald-900">{{ result.setsCreated }}</dd>
          </div>
        </dl>
      </template>

      <button
        type="button"
        class="mt-3 text-sm font-medium text-emerald-800 underline underline-offset-2"
        @click="tryAgain"
      >
        Import another file
      </button>
    </div>

    <div
      v-if="status === 'error' && error"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
      role="alert"
    >
      <p class="text-sm text-red-900">{{ error.message }}</p>
      <button
        type="button"
        class="mt-2 text-sm font-medium text-red-800 underline underline-offset-2"
        @click="tryAgain"
      >
        Try again
      </button>
    </div>
  </section>
</template>
