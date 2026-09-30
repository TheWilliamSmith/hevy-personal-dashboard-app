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
    tone="dark"
    :locked="props.isSaving"
    @close="emit('cancel')"
  >
    <header class="border-b border-zinc-800 px-5 py-4">
      <h2 id="merge-exercise-title" class="text-base font-semibold text-white">
        Merge into {{ props.target?.name }}
      </h2>
      <p class="mt-0.5 text-sm text-zinc-400">
        Pick the duplicate to absorb. Its sessions move here and it is then deleted.
      </p>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <p class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        This cannot be undone. The chosen exercise is permanently removed and every set it holds is
        re-attributed to <strong>{{ props.target?.name }}</strong>.
      </p>

      <div class="mt-4">
        <label for="merge-search" class="mb-1 block text-xs text-zinc-400">
          Search exercises
        </label>
        <input
          id="merge-search"
          v-model="search"
          type="search"
          placeholder="Type to filter…"
          class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        />
      </div>

      <ul class="mt-3 max-h-72 divide-y divide-zinc-800 overflow-y-auto rounded-md border border-zinc-800">
        <li v-if="options.length === 0" class="px-3 py-6 text-center text-sm text-zinc-500">
          No exercise matches.
        </li>
        <li v-for="option in options" :key="option.id">
          <label class="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-zinc-800">
            <input v-model="selectedId" type="radio" :value="option.id" class="mt-1 accent-blue-600" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-zinc-100">{{ option.name }}</span>
              <span class="block text-xs text-zinc-500">
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

      <p v-if="props.error" class="mt-4 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
        {{ props.error }}
      </p>
    </div>

    <footer class="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :disabled="props.isSaving"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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
