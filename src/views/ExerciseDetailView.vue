<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import EditClassificationDialog from '@/components/exercises/EditClassificationDialog.vue';
import ExerciseHistoryList from '@/components/exercises/ExerciseHistoryList.vue';
import ExerciseProgressionChart from '@/components/exercises/ExerciseProgressionChart.vue';
import ExerciseRecordsRow from '@/components/exercises/ExerciseRecordsRow.vue';
import MergeExerciseDialog from '@/components/exercises/MergeExerciseDialog.vue';
import { useExercise } from '@/composables/useExercise';
import { useExercises } from '@/composables/useExercises';
import { useToasts } from '@/composables/useToasts';
import { EQUIPMENT_LABELS, KIND_LABELS, MUSCLE_LABELS, MUSCLE_STYLES } from '@/constants/muscles';
import type { UpdateExercisePayload } from '@/types/exercises';
import { EMPTY, formatInteger, formatVolume, formatWeight } from '@/utils/format';

const route = useRoute();
const { push } = useToasts();

const slug = computed(() => (typeof route.query.exercise === 'string' ? route.query.exercise : ''));

const {
  detail,
  isLoading,
  error,
  notFound,
  isLoadingMore,
  hasMoreHistory,
  isSaving,
  mutationError,
  refresh,
  loadMoreHistory,
  updateClassification,
  mergeInto,
} = useExercise(slug);

const catalog = useExercises();
const mergeCandidates = computed(() => catalog.groups.value.flatMap((group) => group.exercises));

const isEditing = ref(false);
const isMerging = ref(false);

const info = computed(() => detail.value?.exercise ?? null);
const summary = computed(() => detail.value?.summary ?? null);

const lastPerformed = computed(() => {
  const days = summary.value?.daysSinceLast;
  if (days === null || days === undefined) {
    return 'Never performed';
  }
  if (days === 0) {
    return 'Last performed today';
  }
  return `Last performed ${days} day${days === 1 ? '' : 's'} ago`;
});

async function onSave(payload: UpdateExercisePayload): Promise<void> {
  const saved = await updateClassification(payload);
  if (saved) {
    isEditing.value = false;
    catalog.refresh();
    push({ tone: 'success', title: 'Classification updated' });
  }
}

async function onMerge(sourceExerciseId: string): Promise<void> {
  const merged = await mergeInto(sourceExerciseId);
  if (merged) {
    isMerging.value = false;
    catalog.refresh();
    push({
      tone: 'success',
      title: `Merged into ${merged.targetName}`,
      description: `${formatInteger(merged.workoutExercisesRepointed)} sessions re-attributed.`,
    });
  }
}
</script>

<template>
  <div>
    <div class="px-4 pt-2 sm:px-6">
      <RouterLink
        :to="{ name: 'home', query: { tab: 'exercises' } }"
        class="text-sm font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
      >
        ← Back to exercises
      </RouterLink>
    </div>

    <div v-if="isLoading" class="flex flex-col gap-4 px-4 py-4 sm:px-6" aria-busy="true">
      <div class="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div class="grid gap-3 sm:grid-cols-4">
        <div v-for="tile in 4" :key="tile" class="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div class="h-80 animate-pulse rounded-xl bg-slate-100" />
    </div>

    <div
      v-else-if="error"
      class="mx-4 my-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center sm:mx-6"
      role="alert"
    >
      <p class="text-sm text-red-900">
        {{ notFound ? 'This exercise does not exist.' : error }}
      </p>
      <button
        v-if="!notFound"
        type="button"
        class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="refresh"
      >
        Retry
      </button>
    </div>

    <article v-else-if="detail && info && summary" class="flex flex-col gap-4 py-4">
      <header class="flex flex-wrap items-start gap-x-6 gap-y-3 px-4 sm:px-6">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-semibold text-slate-900">{{ info.name }}</h1>

          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
              :class="MUSCLE_STYLES[info.muscleGroup].chip"
            >
              {{ MUSCLE_LABELS[info.muscleGroup] }}
            </span>
            <span
              v-for="muscle in info.secondaryMuscles"
              :key="muscle"
              class="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset"
              :class="MUSCLE_STYLES[muscle].chip"
            >
              {{ MUSCLE_LABELS[muscle] }}
            </span>
            <span
              class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 ring-inset"
            >
              {{ EQUIPMENT_LABELS[info.equipment] }}
            </span>
            <span
              class="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white"
            >
              {{ KIND_LABELS[info.kind] }}
            </span>
            <span
              v-if="info.isCustom"
              class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 ring-inset"
            >
              Custom
            </span>
          </div>

          <p class="mt-2 text-sm text-slate-500">{{ lastPerformed }}</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="isEditing = true"
          >
            Edit classification
          </button>
          <button
            type="button"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            @click="isMerging = true"
          >
            Merge into this
          </button>
        </div>
      </header>

      <ExerciseRecordsRow :records="detail.records" :kind="info.kind" />

      <p class="flex flex-wrap gap-x-5 gap-y-1 px-4 text-xs text-slate-500 sm:px-6">
        <span>{{ formatInteger(summary.sessions) }} sessions</span>
        <span>{{ formatInteger(summary.totalSets) }} sets</span>
        <span>{{ formatInteger(summary.totalReps) }} reps</span>
        <span>{{ formatVolume(summary.totalVolumeKg) }} total</span>
        <span>{{ summary.avgSetsPerSession }} sets/session</span>
        <span>{{ summary.avgRepsPerSet }} reps/set</span>
        <span>
          {{ summary.avgWeightKg === null ? EMPTY : `${formatWeight(summary.avgWeightKg)} kg` }} avg
        </span>
      </p>

      <div class="px-4 sm:px-6">
        <ExerciseProgressionChart
          :points="detail.progression"
          :kind="info.kind"
          :is-loading="false"
          :error="null"
          @retry="refresh"
        />
      </div>

      <ExerciseHistoryList
        :entries="detail.history.data"
        :has-more="hasMoreHistory"
        :is-loading-more="isLoadingMore"
        :is-loading="false"
        @load-more="loadMoreHistory"
      />
    </article>

    <EditClassificationDialog
      :exercise="info"
      :open="isEditing"
      :is-saving="isSaving"
      :error="mutationError"
      @cancel="isEditing = false"
      @save="onSave"
    />

    <MergeExerciseDialog
      :target="info"
      :candidates="mergeCandidates"
      :open="isMerging"
      :is-saving="isSaving"
      :error="mutationError"
      @cancel="isMerging = false"
      @merge="onMerge"
    />
  </div>
</template>
