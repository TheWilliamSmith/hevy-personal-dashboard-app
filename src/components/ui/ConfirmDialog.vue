<script setup lang="ts">
import BaseDialog from '@/components/ui/BaseDialog.vue';

const props = defineProps<{
  open: boolean;
  labelledBy: string;
  title: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  isBusy?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{ cancel: []; confirm: [] }>();
</script>

<template>
  <BaseDialog
    :open="props.open"
    :labelled-by="props.labelledBy"
    :locked="props.isBusy"
    @close="emit('cancel')"
  >
    <header class="border-b border-zinc-800 px-5 py-4">
      <h2 :id="props.labelledBy" class="text-base font-semibold text-white">{{ props.title }}</h2>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-zinc-300">
      <slot />
      <p v-if="props.error" class="mt-4 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
        {{ props.error }}
      </p>
    </div>

    <footer class="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :disabled="props.isBusy"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :class="props.tone === 'danger' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-white text-zinc-900 hover:bg-zinc-200'"
        :disabled="props.isBusy"
        :aria-busy="props.isBusy"
        @click="emit('confirm')"
      >
        <span
          v-if="props.isBusy"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
        {{ props.confirmLabel }}
      </button>
    </footer>
  </BaseDialog>
</template>
