<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  isBusy: boolean;
  progress: number;
  error: string | null;
  fileName: string | null;
}>();

const emit = defineEmits<{ file: [file: File | undefined]; dismissError: [] }>();

const input = ref<HTMLInputElement | null>(null);
const openPickerButton = ref<HTMLButtonElement | null>(null);
const isDragging = ref(false);

const label = computed(() =>
  props.isBusy ? `Analysing… ${props.progress}%` : 'Import Hevy export',
);

/** Clearing the value makes re-picking the same file fire @change again. */
function clearInput(): void {
  if (input.value) {
    input.value.value = '';
  }
}

function openPicker(): void {
  if (props.isBusy) {
    return;
  }
  clearInput();
  input.value?.click();
}

function onChange(event: Event): void {
  emit('file', (event.target as HTMLInputElement).files?.[0]);
}

function onDrop(event: DragEvent): void {
  isDragging.value = false;
  if (props.isBusy) {
    return;
  }
  clearInput();
  emit('file', event.dataTransfer?.files?.[0]);
}

/** The parent refocuses this after the preview dialog closes on expiry. */
defineExpose({ focus: () => openPickerButton.value?.focus() });
</script>

<template>
  <section class="w-full">
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
        ref="openPickerButton"
        type="button"
        class="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="props.isBusy"
        :aria-busy="props.isBusy"
        @click="openPicker"
      >
        {{ label }}
      </button>

      <p v-if="props.fileName" class="mt-3 truncate text-sm text-slate-700">
        {{ props.fileName }}
      </p>

      <div
        v-if="props.isBusy"
        class="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Upload progress"
        :aria-valuenow="props.progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full bg-indigo-600 transition-[width] duration-150"
          :style="{ width: `${props.progress}%` }"
        />
      </div>
    </div>

    <div
      v-if="props.error"
      class="mt-3 rounded-xl border border-red-200 bg-red-50 p-4"
      role="alert"
    >
      <p class="text-sm text-red-900">{{ props.error }}</p>
      <button
        type="button"
        class="mt-2 text-sm font-medium text-red-800 underline underline-offset-2"
        @click="emit('dismissError')"
      >
        Try again
      </button>
    </div>
  </section>
</template>
