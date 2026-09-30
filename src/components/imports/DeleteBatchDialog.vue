<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import type { ImportBatchSummary } from '@/types/imports';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  batch: ImportBatchSummary | null;
  isDeleting: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ cancel: []; confirm: [deleteWorkouts: boolean] }>();

const deleteWorkouts = ref(true);
const typedName = ref('');

const open = computed(() => props.batch !== null);

watch(open, (isOpen) => {
  if (isOpen) {
    deleteWorkouts.value = true;
    typedName.value = '';
  }
});

const needsTypedName = computed(() => deleteWorkouts.value && (props.batch?.workoutsStillPresent ?? 0) > 0);

const nameMatches = computed(() => typedName.value.trim() === props.batch?.fileName);

const canDelete = computed(
  () => !props.isDeleting && (!needsTypedName.value || nameMatches.value),
);

const setsAtRisk = computed(() => props.batch?.setsCreated ?? 0);
const workoutsAtRisk = computed(() => props.batch?.workoutsStillPresent ?? 0);
</script>

<template>
  <BaseDialog
    :open="open"
    labelled-by="delete-batch-title"
    :locked="props.isDeleting"
    @close="emit('cancel')"
  >
    <header class="border-b border-zinc-800 px-5 py-4">
      <h2 id="delete-batch-title" class="text-base font-semibold text-white">Delete import</h2>
      <p class="mt-0.5 truncate text-sm text-zinc-500">{{ props.batch?.fileName }}</p>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <p v-if="deleteWorkouts && workoutsAtRisk > 0" class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        This will permanently delete
        <strong>{{ formatInteger(workoutsAtRisk) }} workouts</strong>
        and <strong>{{ formatInteger(setsAtRisk) }} sets</strong>. This cannot be undone.
      </p>
      <p v-else class="text-sm text-zinc-300">
        This removes the import record only. The workouts it created stay in your data.
      </p>

      <fieldset class="mt-4">
        <legend class="text-xs text-zinc-400">What should happen</legend>

        <label class="mt-2 flex items-start gap-2 text-sm text-zinc-100">
          <input
            v-model="deleteWorkouts"
            type="radio"
            name="delete-mode"
            :value="true"
            class="mt-1 accent-red-500"
          />
          <span>
            Delete the import and its workouts
            <span class="block text-xs text-zinc-500">
              Removes {{ formatInteger(workoutsAtRisk) }} workouts and their sets.
            </span>
          </span>
        </label>

        <label class="mt-3 flex items-start gap-2 text-sm text-zinc-100">
          <input
            v-model="deleteWorkouts"
            type="radio"
            name="delete-mode"
            :value="false"
            class="mt-1 accent-red-500"
          />
          <span>
            Delete only the import record, keep the workouts
            <span class="block text-xs text-zinc-500">
              The workouts stay but are no longer attributed to any import.
            </span>
          </span>
        </label>
      </fieldset>

      <div v-if="needsTypedName" class="mt-4">
        <label for="confirm-file-name" class="block text-xs text-zinc-400">
          Type <span class="font-mono text-zinc-100">{{ props.batch?.fileName }}</span> to confirm
        </label>
        <input
          id="confirm-file-name"
          v-model="typedName"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
        />
      </div>

      <p v-if="props.error" class="mt-4 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
        {{ props.error }}
      </p>
    </div>

    <footer class="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :disabled="props.isDeleting"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canDelete"
        :aria-busy="props.isDeleting"
        @click="emit('confirm', deleteWorkouts)"
      >
        <span
          v-if="props.isDeleting"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
        {{ deleteWorkouts ? 'Delete workouts' : 'Delete record' }}
      </button>
    </footer>
  </BaseDialog>
</template>
