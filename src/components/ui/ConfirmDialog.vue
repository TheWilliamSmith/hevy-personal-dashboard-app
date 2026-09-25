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
    <header class="border-b border-slate-200 px-5 py-4">
      <h2 :id="props.labelledBy" class="text-base font-semibold text-slate-900">{{ props.title }}</h2>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-slate-700">
      <slot />
      <p v-if="props.error" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-900" role="alert">
        {{ props.error }}
      </p>
    </div>

    <footer class="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="props.isBusy"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        :class="props.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
        :disabled="props.isBusy"
        :aria-busy="props.isBusy"
        @click="emit('confirm')"
      >
        <span
          v-if="props.isBusy"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
        {{ props.confirmLabel }}
      </button>
    </footer>
  </BaseDialog>
</template>
