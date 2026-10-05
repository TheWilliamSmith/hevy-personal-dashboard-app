<script setup lang="ts">
import { t } from '@/i18n';
import { CalendarClock, ChevronLeft, Dumbbell, Hash, Layers, ListOrdered, Repeat, Scale, Weight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import EditClassificationDialog from '@/components/exercises/EditClassificationDialog.vue';
import ExerciseHistoryList from '@/components/exercises/ExerciseHistoryList.vue';
import ExerciseProgressionChart from '@/components/exercises/ExerciseProgressionChart.vue';
import MergeExerciseDialog from '@/components/exercises/MergeExerciseDialog.vue';
import PersonalRecords from '@/components/exercises/PersonalRecords.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import MetricGrid, { type MetricItem } from '@/components/ui/MetricGrid.vue';
import SectionError from '@/components/ui/SectionError.vue';
import { useExercise } from '@/composables/useExercise';
import { useExercises } from '@/composables/useExercises';
import { useMeasurements } from '@/composables/useMeasurements';
import { useProfile } from '@/composables/useProfile';
import { useToasts } from '@/composables/useToasts';
import { EQUIPMENT_LABELS, KIND_LABELS, MUSCLE_LABELS, MUSCLE_STYLES } from '@/constants/muscles';
import type { UpdateExercisePayload } from '@/types/exercises';
import { EMPTY, formatInteger, formatLoad, formatNumber, formatVolume } from '@/utils/format';
import { bodyweightOn } from '@/utils/measurements';
import { formatDaysAgo } from '@/utils/progress';

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

const measurements = useMeasurements();
const { profile } = useProfile();
const bodyweightAtBest = computed(() => {
  const best = detail.value?.records.best1RM;
  return best ? bodyweightOn(best.date, measurements.entries.value, profile.value?.bodyweightKg ?? null) : null;
});

const isEditing = ref(false);
const isMerging = ref(false);

const info = computed(() => detail.value?.exercise ?? null);
const summary = computed(() => detail.value?.summary ?? null);

const lastPerformed = computed(() => {
  const days = summary.value?.daysSinceLast;
  return days === null || days === undefined ? t('exercises.never') : formatDaysAgo(days);
});

const metrics = computed<MetricItem[]>(() => {
  const value = summary.value;
  return [
    { label: t('exercises.sessions'), value: formatInteger(value?.sessions), icon: Hash },
    { label: t('exercises.sets'), value: formatInteger(value?.totalSets), icon: Layers },
    { label: t('exercises.reps'), value: formatInteger(value?.totalReps), icon: Repeat },
    { label: t('exercises.totalVolume'), value: formatVolume(value?.totalVolumeKg), icon: Weight },
    { label: t('exercises.setsPerSession'), value: formatNumber(value?.avgSetsPerSession), icon: ListOrdered },
    { label: t('exercises.repsPerSet'), value: formatNumber(value?.avgRepsPerSet), icon: Dumbbell },
    {
      label: t('exercises.avgWeight'),
      value: value?.avgWeightKg === null || value?.avgWeightKg === undefined ? EMPTY : formatLoad(value.avgWeightKg),
      icon: Scale,
    },
    { label: t('exercises.lastPerformed'), value: lastPerformed.value, icon: CalendarClock },
  ];
});

async function onSave(payload: UpdateExercisePayload): Promise<void> {
  const saved = await updateClassification(payload);
  if (saved) {
    isEditing.value = false;
    catalog.refresh();
    push({ tone: 'success', title: t('exercises.classificationUpdated') });
  }
}

async function onMerge(sourceExerciseId: string): Promise<void> {
  const merged = await mergeInto(sourceExerciseId);
  if (merged) {
    isMerging.value = false;
    catalog.refresh();
    push({
      tone: 'success',
      title: t('exercises.mergedInto', { name: merged.targetName }),
      description: t('exercises.reattributed', { count: formatInteger(merged.workoutExercisesRepointed) }),
    });
  }
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <RouterLink
        :to="{ name: 'home', query: { tab: 'exercises' } }"
        class="-ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
        :class="focus"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('exercises.all') }}
      </RouterLink>

      <div v-if="isLoading && !detail" class="flex flex-col gap-6" aria-busy="true">
        <div class="h-8 w-72 animate-pulse rounded bg-zinc-900" />
        <div class="h-72 animate-pulse rounded-md bg-zinc-900" />
        <div class="h-16 animate-pulse rounded-md bg-zinc-900" />
      </div>

      <EmptyState v-else-if="error && notFound" :message="t('exercises.notFound')" />

      <SectionError v-else-if="error" :message="error" @retry="refresh" />

      <template v-else-if="detail && info && summary">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 class="text-2xl font-semibold tracking-tight text-white">{{ info.name }}</h2>
            <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
              <span class="flex items-center gap-1.5 text-zinc-200">
                <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: MUSCLE_STYLES[info.muscleGroup].hex }" aria-hidden="true" />
                {{ MUSCLE_LABELS[info.muscleGroup] }}
              </span>
              <span v-for="muscle in info.secondaryMuscles" :key="muscle" class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: MUSCLE_STYLES[muscle].hex }" aria-hidden="true" />
                {{ MUSCLE_LABELS[muscle] }}
              </span>
              <span>{{ EQUIPMENT_LABELS[info.equipment] }}</span>
              <span>{{ KIND_LABELS[info.kind] }}</span>
              <span v-if="info.isCustom" class="text-amber-400">{{ t('exercises.custom') }}</span>
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-if="info.kind === 'STRENGTH' && detail.records.best1RM"
              :to="{ name: 'home', query: { tab: 'calculators', exercise: info.slug } }"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
              :class="focus"
            >
              {{ t('exercises.planLoads') }}
            </RouterLink>
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
              :class="focus"
              @click="isEditing = true"
            >
              {{ t('exercises.editClassification') }}
            </button>
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-zinc-800 hover:text-red-300"
              :class="focus"
              @click="isMerging = true"
            >
              {{ t('exercises.mergeIntoThis') }}
            </button>
          </div>
        </header>

        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
          <ExerciseProgressionChart class="lg:pr-8" :points="detail.progression" :kind="info.kind" />
          <PersonalRecords class="border-zinc-800 lg:border-l lg:pl-8" :records="detail.records" :kind="info.kind" :bodyweight-kg="bodyweightAtBest" />
        </div>

        <MetricGrid :items="metrics" :is-loading="false" />

        <ExerciseHistoryList
          :entries="detail.history.data"
          :total="detail.history.meta.total"
          :has-more="hasMoreHistory"
          :is-loading-more="isLoadingMore"
          @load-more="loadMoreHistory"
        />
      </template>
    </div>

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
