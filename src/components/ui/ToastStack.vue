<script setup lang="ts">
import { t } from '@/i18n';
import { useToasts } from '@/composables/useToasts';

const { toasts, dismiss } = useToasts();

const TONES: Readonly<Record<string, string>> = {
  success: 'border-emerald-500/40 bg-zinc-900 text-emerald-200',
  warning: 'border-amber-500/40 bg-zinc-900 text-amber-200',
  error: 'border-red-500/40 bg-zinc-900 text-red-200',
};
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-xl shadow-black/40"
      :class="TONES[toast.tone]"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">{{ toast.title }}</p>
        <p v-if="toast.description" class="mt-0.5 text-xs opacity-90">{{ toast.description }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded px-1 text-sm opacity-60 hover:opacity-100"
        :aria-label="t('common.dismissNotification')"
        @click="dismiss(toast.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
