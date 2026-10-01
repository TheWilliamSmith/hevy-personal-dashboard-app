<script setup lang="ts">
import { t } from '@/i18n';
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
    secondaries.value = [...(exercise.secondaryMuscles ?? [])];
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
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <BaseDialog
    :open="props.open"
    labelled-by="edit-classification-title"
   
    :locked="props.isSaving"
    @close="emit('cancel')"
  >
    <header class="border-b border-zinc-800 px-5 py-4">
      <h2 id="edit-classification-title" class="text-base font-semibold text-white">
        {{ t('exercises.edit.title') }}
      </h2>
      <p class="mt-0.5 truncate text-sm text-zinc-500">{{ props.exercise?.name }}</p>
    </header>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <div>
        <label for="edit-muscle" class="mb-1 block text-xs text-zinc-400">
          {{ t('exercises.edit.primary') }}
        </label>
        <select id="edit-muscle" v-model="muscleGroup" :class="field">
          <option v-for="group in MUSCLE_ORDER" :key="group" :value="group">
            {{ MUSCLE_LABELS[group] }}
          </option>
        </select>
      </div>

      <fieldset>
        <legend class="mb-1 text-xs text-zinc-400">
          {{ t('exercises.edit.secondary', { count: secondaries.length, max: MAX_SECONDARIES }) }}
        </legend>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="group in MUSCLE_ORDER"
            :key="group"
            type="button"
            class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40"
            :class="
              secondaries.includes(group)
                ? 'border-zinc-600 bg-zinc-800 text-white'
                : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            "
            :aria-pressed="secondaries.includes(group)"
            :disabled="group === muscleGroup"
            @click="toggleSecondary(group)"
          >
            <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: MUSCLE_STYLES[group].hex }" aria-hidden="true" />
            {{ MUSCLE_LABELS[group] }}
          </button>
        </div>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="edit-equipment" class="mb-1 block text-xs text-zinc-400">
            {{ t('exercises.edit.equipment') }}
          </label>
          <select id="edit-equipment" v-model="equipment" :class="field">
            <option v-for="item in EQUIPMENT_ORDER" :key="item" :value="item">
              {{ EQUIPMENT_LABELS[item] }}
            </option>
          </select>
        </div>

        <div>
          <label for="edit-kind" class="mb-1 block text-xs text-zinc-400">{{ t('exercises.edit.kind') }}</label>
          <select id="edit-kind" v-model="kind" :class="field">
            <option v-for="item in KIND_ORDER" :key="item" :value="item">
              {{ KIND_LABELS[item] }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label for="edit-aliases" class="mb-1 block text-xs text-zinc-400">
          {{ t('exercises.edit.aliases') }}
        </label>
        <input id="edit-aliases" v-model="aliasText" type="text" :class="field" />
        <p class="mt-1 text-xs text-zinc-500">
          {{ t('exercises.edit.aliasesHint') }}
        </p>
      </div>

      <p v-if="props.error" class="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
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
        {{ t('common.cancel') }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
        :disabled="props.isSaving"
        :aria-busy="props.isSaving"
        @click="save"
      >
        <span
          v-if="props.isSaving"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
          aria-hidden="true"
        />
        {{ t('exercises.edit.save') }}
      </button>
    </footer>
  </BaseDialog>
</template>
