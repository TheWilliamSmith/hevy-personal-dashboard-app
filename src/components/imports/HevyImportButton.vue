<script setup lang="ts">
import { t } from '@/i18n';
import { Upload } from 'lucide-vue-next';
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
  props.isBusy ? t('imports.button.analysing', { progress: props.progress }) : t('imports.button.choose'),
);

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

defineExpose({ focus: () => openPickerButton.value?.focus() });
</script>

<template>
  <section class="w-full">
    <div
      class="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors"
      :class="isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="input"
        type="file"
        accept=".csv,text/csv"
        :aria-label="t('imports.button.fileLabel')"
        class="hidden"
        @change="onChange"
      />

      <Upload class="h-6 w-6 text-zinc-500" aria-hidden="true" />
      <p class="text-sm text-zinc-400">{{ t('imports.button.drop') }}</p>

      <button
        ref="openPickerButton"
        type="button"
        class="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isBusy"
        :aria-busy="isBusy"
        @click="openPicker"
      >
        {{ label }}
      </button>

      <p v-if="fileName" class="max-w-full truncate text-xs text-zinc-400">{{ fileName }}</p>

      <div
        v-if="isBusy"
        class="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800"
        role="progressbar"
        :aria-label="t('imports.button.progress')"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="h-full bg-blue-500 transition-[width] duration-150" :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <div
      v-if="error"
      class="mt-3 flex items-center justify-between gap-3 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2"
      role="alert"
    >
      <p class="text-sm text-red-200">{{ error }}</p>
      <button
        type="button"
        class="shrink-0 rounded-md border border-red-800 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-900/50"
        @click="emit('dismissError')"
      >
        {{ t('imports.button.tryAgain') }}
      </button>
    </div>
  </section>
</template>
