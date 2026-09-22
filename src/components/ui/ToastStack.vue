<script setup lang="ts">
import { useToasts } from '@/composables/useToasts';

const { toasts, dismiss } = useToasts();

const TONES: Readonly<Record<string, string>> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    role="status"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg"
      :class="TONES[toast.tone]"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">{{ toast.title }}</p>
        <p v-if="toast.description" class="mt-0.5 text-xs opacity-90">{{ toast.description }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded px-1 text-sm opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
        @click="dismiss(toast.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
