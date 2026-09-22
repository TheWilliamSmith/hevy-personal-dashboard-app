<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/constants/muscles';
import type { ExerciseCard, ExerciseInfo } from '@/types/exercises';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  target: ExerciseInfo | null;
  candidates: ExerciseCard[];
  open: boolean;
  isSaving: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ cancel: []; merge: [sourceExerciseId: string] }>();

const search = ref('');
const selectedId = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) {
      search.value = '';
      selectedId.value = '';
    }
  },
);

/** The target cannot merge into itself — the API answers 409 for that. */
const options = computed(() => {
  const term = search.value.trim().toLowerCase();
  return props.candidates
    .filter((candidate) => candidate.id !== props.target?.id)
    .filter((candidate) => (term ? candidate.name.toLowerCase().includes(term) : true))
    .slice(0, 50);
});

const selected = computed(() => options.value.find((option) => option.id === selectedId.value) ?? null);
</script>

<template>
  <BaseDialog
    :open="props.open"
    labelled-by="merge-exercise-title"
    :locked="props.isSaving"
    @close="emit('cancel')"
  >
    <header class="border-b border-slate-200 px-5 py-4">
      <h2 id="merge-exercise-title" class="text-base font-semibold text-slate-900">
        Merge into {{ props.target?.name }}
      </h2>
      <p class="mt-0.5 text-sm text-slate-500">
        Pick the duplicate to absorb. Its sessions move here and it is then deleted.
      </p>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
        This cannot be undone. The chosen exercise is permanently removed and every set it holds is
        re-attributed to <strong>{{ props.target?.name }}</strong>.
      </p>

      <div class="mt-4">
        <label for="merge-search" class="mb-1 block text-xs font-medium text-slate-600">
          Search exercises
        </label>
        <input
          id="merge-search"
          v-model="search"
          type="search"
          placeholder="Type to filter…"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
        />
      </div>

      <ul class="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
        <li v-if="options.length === 0" class="px-3 py-6 text-center text-sm text-slate-500">
          No exercise matches.
        </li>
        <li v-for="option in options" :key="option.id">
          <label class="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-slate-50">
            <input v-model="selectedId" type="radio" :value="option.id" class="mt-1" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-slate-900">{{ option.name }}</span>
              <span class="block text-xs text-slate-500">
                {{ MUSCLE_LABELS[option.muscleGroup] }}
                <span aria-hidden="true"> · </span>
                {{ EQUIPMENT_LABELS[option.equipment] }}
                <span aria-hidden="true"> · </span>
                {{ formatInteger(option.sessions) }} sessions
              </span>
            </span>
          </label>
        </li>
      </ul>

      <p v-if="props.error" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-900" role="alert">
        {{ props.error }}
      </p>
    </div>

    <footer class="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="props.isSaving"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="props.isSaving || !selected"
        :aria-busy="props.isSaving"
        @click="selected && emit('merge', selected.id)"
      >
        <span
          v-if="props.isSaving"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
        {{ selected ? `Merge ${selected.name}` : 'Merge' }}
      </button>
    </footer>
  </BaseDialog>
</template>
