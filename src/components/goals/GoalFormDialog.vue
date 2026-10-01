<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import { GOAL_TYPES, isExerciseGoal } from '@/constants/goals';
import { ApiError, apiGet } from '@/lib/api';
import type { ExerciseCatalog } from '@/types/exercises';
import type { Goal, GoalChanges, GoalInput, GoalType } from '@/types/goals';
import { goalTitle, todayKey } from '@/utils/goals';

export type GoalSubmission = { kind: 'create'; input: GoalInput } | { kind: 'update'; id: string; changes: GoalChanges };

const props = defineProps<{
  open: boolean;
  goal: Goal | null;
  submit: (submission: GoalSubmission) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();

interface ExerciseOption {
  id: string;
  name: string;
  sessions: number;
}

const form = reactive({ type: 'EXERCISE_1RM' as GoalType, exerciseId: '', target: '', startsAt: todayKey(), deadline: '' });
const fieldErrors = reactive<Record<string, string | null>>({ exerciseId: null, target: null, deadline: null, startsAt: null });
const formError = ref<string | null>(null);
const isSaving = ref(false);
const exercises = ref<ExerciseOption[]>([]);
const exercisesError = ref<string | null>(null);

const isEdit = computed(() => props.goal !== null);
const typeHint = computed(() => GOAL_TYPES.find((option) => option.value === form.type)?.hint ?? '');
const unit = computed(() => (form.type === 'WEEKLY_WORKOUTS' ? 'workouts' : 'kg'));

async function loadExercises(): Promise<void> {
  if (exercises.value.length > 0) {
    return;
  }
  try {
    const catalog = await apiGet<ExerciseCatalog>('/exercises');
    exercises.value = catalog.groups
      .flatMap((group) => group.exercises)
      .map((exercise) => ({ id: exercise.id, name: exercise.name, sessions: exercise.sessions }))
      .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
  } catch (caught) {
    exercisesError.value = caught instanceof ApiError ? caught.message : 'Could not load your exercises.';
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    Object.assign(fieldErrors, { exerciseId: null, target: null, deadline: null, startsAt: null });
    formError.value = null;
    const goal = props.goal;
    Object.assign(form, {
      type: goal?.type ?? 'EXERCISE_1RM',
      exerciseId: goal?.exercise?.id ?? '',
      target: goal ? String(goal.target) : '',
      startsAt: goal ? goal.startsAt.slice(0, 10) : todayKey(),
      deadline: goal?.deadline ? goal.deadline.slice(0, 10) : '',
    });
    if (!goal) {
      void loadExercises();
    }
  },
);

function validate(): number | null {
  const target = Number(form.target.replace(',', '.'));
  fieldErrors.target = Number.isFinite(target) && target > 0 ? null : 'Enter a target above zero.';
  if (!fieldErrors.target && form.type === 'WEEKLY_WORKOUTS' && (!Number.isInteger(target) || target > 14)) {
    fieldErrors.target = 'Use a whole number of workouts, up to 14.';
  }
  fieldErrors.exerciseId = !isEdit.value && isExerciseGoal(form.type) && !form.exerciseId ? 'Choose an exercise.' : null;
  return fieldErrors.target || fieldErrors.exerciseId ? null : target;
}

async function onSubmit(): Promise<void> {
  formError.value = null;
  const target = validate();
  if (target === null) {
    return;
  }
  isSaving.value = true;
  try {
    await props.submit(
      props.goal
        ? { kind: 'update', id: props.goal.id, changes: { target, deadline: form.deadline || null } }
        : {
            kind: 'create',
            input: {
              type: form.type,
              target,
              ...(isExerciseGoal(form.type) ? { exerciseId: form.exerciseId } : {}),
              ...(form.type === 'PERIOD_VOLUME' ? { startsAt: form.startsAt } : {}),
              ...(form.deadline ? { deadline: form.deadline } : {}),
            },
          },
    );
    emit('close');
  } catch (caught) {
    showError(caught);
  } finally {
    isSaving.value = false;
  }
}

function showError(caught: unknown): void {
  if (caught instanceof ApiError) {
    const { field } = (caught.body ?? {}) as { field?: unknown };
    if (typeof field === 'string' && field in fieldErrors) {
      fieldErrors[field] = caught.message;
      return;
    }
    formError.value = caught.message;
    return;
  }
  formError.value = 'Something went wrong. Try again.';
}

const label = 'mb-1 block text-xs text-zinc-400';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const field = `w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 [color-scheme:dark] ${focus}`;
const select = `w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 ${focus}`;
const errorText = 'mt-1 text-xs text-red-400';
</script>

<template>
  <BaseDialog :open="open" labelled-by="goal-form-title" size="md" :locked="isSaving" @close="emit('close')">
    <form class="flex min-h-0 flex-1 flex-col" novalidate @submit.prevent="onSubmit">
      <header class="border-b border-zinc-800 px-5 py-4">
        <h2 id="goal-form-title" class="text-base font-semibold text-white">{{ goal ? 'Edit goal' : 'New goal' }}</h2>
        <p v-if="goal" class="mt-0.5 text-xs text-zinc-500">{{ goalTitle(goal) }}</p>
      </header>

      <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        <div v-if="!goal" class="flex flex-col gap-2">
          <span :class="label">Goal type</span>
          <SegmentedControl v-model="form.type" :options="GOAL_TYPES" label="Goal type" class="self-start" />
          <p class="text-xs text-zinc-500">{{ typeHint }}</p>
        </div>

        <div v-if="!goal && isExerciseGoal(form.type)">
          <label for="goal-exercise" :class="label">Exercise</label>
          <select
            id="goal-exercise"
            v-model="form.exerciseId"
            :class="select"
            :aria-invalid="Boolean(fieldErrors.exerciseId)"
            aria-describedby="goal-exercise-help"
          >
            <option value="" disabled>Choose an exercise</option>
            <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">
              {{ exercise.name }}{{ exercise.sessions ? ` · ${exercise.sessions} sessions` : '' }}
            </option>
          </select>
          <p id="goal-exercise-help" :class="errorText">{{ fieldErrors.exerciseId ?? exercisesError ?? '' }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="goal-target" :class="label">Target ({{ unit }})</label>
            <input
              id="goal-target"
              v-model="form.target"
              type="text"
              inputmode="decimal"
              :placeholder="form.type === 'WEEKLY_WORKOUTS' ? '4' : '100'"
              :class="field"
              :aria-invalid="Boolean(fieldErrors.target)"
              aria-describedby="goal-target-help"
            />
            <p id="goal-target-help" :class="errorText">{{ fieldErrors.target ?? '' }}</p>
          </div>
          <div>
            <label for="goal-deadline" :class="label">Deadline (optional)</label>
            <input
              id="goal-deadline"
              v-model="form.deadline"
              type="date"
              :class="field"
              :aria-invalid="Boolean(fieldErrors.deadline)"
              aria-describedby="goal-deadline-help"
            />
            <p id="goal-deadline-help" :class="errorText">{{ fieldErrors.deadline ?? '' }}</p>
          </div>
          <div v-if="!goal && form.type === 'PERIOD_VOLUME'">
            <label for="goal-start" :class="label">Counted from</label>
            <input
              id="goal-start"
              v-model="form.startsAt"
              type="date"
              :class="field"
              :aria-invalid="Boolean(fieldErrors.startsAt)"
              aria-describedby="goal-start-help"
            />
            <p id="goal-start-help" :class="errorText">{{ fieldErrors.startsAt ?? '' }}</p>
          </div>
        </div>

        <p v-if="formError" class="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
          {{ formError }}
        </p>
      </div>

      <footer class="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
        <button
          type="button"
          class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
          :class="focus"
          :disabled="isSaving"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isSaving"
          :aria-busy="isSaving"
        >
          {{ goal ? 'Save goal' : 'Create goal' }}
        </button>
      </footer>
    </form>
  </BaseDialog>
</template>
