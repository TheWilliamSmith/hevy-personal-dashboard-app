<script setup lang="ts">
import { ref, watch } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_ORDER,
  KIND_LABELS,
  KIND_ORDER,
  MUSCLE_LABELS,
  MUSCLE_ORDER,
  MUSCLE_STYLES,
} from '@/constants/muscles';
import type {
  Equipment,
  ExerciseInfo,
  ExerciseKind,
  MuscleGroup,
  UpdateExercisePayload,
} from '@/types/exercises';

const props = defineProps<{
  exercise: ExerciseInfo | null;
  open: boolean;
  isSaving: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ cancel: []; save: [payload: UpdateExercisePayload] }>();

/** The API caps secondaries at 14. */
const MAX_SECONDARIES = 14;

const muscleGroup = ref<MuscleGroup>('CHEST');
const secondaries = ref<MuscleGroup[]>([]);
const equipment = ref<Equipment>('BARBELL');
const kind = ref<ExerciseKind>('STRENGTH');
const aliasText = ref('');

watch(
  () => [props.open, props.exercise] as const,
  ([open, exercise]) => {
    if (!open || !exercise) {
      return;
    }
    muscleGroup.value = exercise.muscleGroup;
    secondaries.value = [...exercise.secondaryMuscles];
    equipment.value = exercise.equipment;
    kind.value = exercise.kind;
    aliasText.value = exercise.aliases.join(', ');
  },
  { immediate: true },
);

function toggleSecondary(group: MuscleGroup): void {
  const current = new Set(secondaries.value);
  if (current.has(group)) {
    current.delete(group);
  } else if (current.size < MAX_SECONDARIES) {
    current.add(group);
  }
  secondaries.value = [...current];
}

function save(): void {
  emit('save', {
    muscleGroup: muscleGroup.value,
    // The primary group must not also appear as a secondary.
    secondaryMuscles: secondaries.value.filter((group) => group !== muscleGroup.value),
    equipment: equipment.value,
    kind: kind.value,
    aliases: aliasText.value
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean),
  });
}

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none';
</script>

<template>
  <BaseDialog
    :open="props.open"
    labelled-by="edit-classification-title"
    :locked="props.isSaving"
    @close="emit('cancel')"
  >
    <header class="border-b border-slate-200 px-5 py-4">
      <h2 id="edit-classification-title" class="text-base font-semibold text-slate-900">
        Edit classification
      </h2>
      <p class="mt-0.5 truncate text-sm text-slate-500">{{ props.exercise?.name }}</p>
    </header>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <div>
        <label for="edit-muscle" class="mb-1 block text-xs font-medium text-slate-600">
          Primary muscle group
        </label>
        <select id="edit-muscle" v-model="muscleGroup" :class="field">
          <option v-for="group in MUSCLE_ORDER" :key="group" :value="group">
            {{ MUSCLE_LABELS[group] }}
          </option>
        </select>
      </div>

      <fieldset>
        <legend class="mb-1 text-xs font-medium text-slate-600">
          Secondary muscles ({{ secondaries.length }}/{{ MAX_SECONDARIES }})
        </legend>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="group in MUSCLE_ORDER"
            :key="group"
            type="button"
            class="rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors ring-inset disabled:opacity-40"
            :class="
              secondaries.includes(group)
                ? MUSCLE_STYLES[group].chip + ' ring-2'
                : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
            "
            :aria-pressed="secondaries.includes(group)"
            :disabled="group === muscleGroup"
            @click="toggleSecondary(group)"
          >
            {{ MUSCLE_LABELS[group] }}
          </button>
        </div>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="edit-equipment" class="mb-1 block text-xs font-medium text-slate-600">
            Equipment
          </label>
          <select id="edit-equipment" v-model="equipment" :class="field">
            <option v-for="item in EQUIPMENT_ORDER" :key="item" :value="item">
              {{ EQUIPMENT_LABELS[item] }}
            </option>
          </select>
        </div>

        <div>
          <label for="edit-kind" class="mb-1 block text-xs font-medium text-slate-600">Kind</label>
          <select id="edit-kind" v-model="kind" :class="field">
            <option v-for="item in KIND_ORDER" :key="item" :value="item">
              {{ KIND_LABELS[item] }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label for="edit-aliases" class="mb-1 block text-xs font-medium text-slate-600">
          Aliases (comma separated)
        </label>
        <input id="edit-aliases" v-model="aliasText" type="text" :class="field" />
        <p class="mt-1 text-xs text-slate-500">
          Alternative names matched when importing, e.g. a French export label.
        </p>
      </div>

      <p v-if="props.error" class="rounded-lg bg-red-50 p-3 text-sm text-red-900" role="alert">
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
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        :disabled="props.isSaving"
        :aria-busy="props.isSaving"
        @click="save"
      >
        <span
          v-if="props.isSaving"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
        Save
      </button>
    </footer>
  </BaseDialog>
</template>
