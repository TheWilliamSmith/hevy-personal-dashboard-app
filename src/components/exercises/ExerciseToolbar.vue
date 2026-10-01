<script setup lang="ts">
import { t } from '@/i18n';
import { Search } from 'lucide-vue-next';
import { ref, watch } from 'vue';

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
  ExerciseFilters,
  ExerciseKind,
  ExerciseSortBy,
  MuscleGroup,
} from '@/types/exercises';

const props = defineProps<{ filters: ExerciseFilters; hasActiveFilters: boolean }>();

const emit = defineEmits<{
  search: [value: string];
  toggleMuscle: [group: MuscleGroup];
  equipment: [value: Equipment | ''];
  kind: [value: ExerciseKind | ''];
  sortBy: [value: ExerciseSortBy];
  toggleHideNeverPerformed: [];
  clear: [];
}>();

const SORTS: ReadonlyArray<{ value: ExerciseSortBy; key: string }> = [
  { value: 'name', key: 'exercises.toolbar.sortName' },
  { value: 'sessions', key: 'exercises.toolbar.sortSessions' },
  { value: 'volume', key: 'exercises.toolbar.sortVolume' },
  { value: 'lastPerformed', key: 'exercises.toolbar.sortLastPerformed' },
];

const searchTerm = ref(props.filters.search);

watch(
  () => props.filters.search,
  (value) => {
    if (value !== searchTerm.value) {
      searchTerm.value = value;
    }
  },
);

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const field = `rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 ${focus}`;
const label = 'text-xs text-zinc-400';
</script>

<template>
  <div class="z-20 -mx-4 flex flex-col lg:sticky lg:top-0 gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="relative w-full sm:w-auto sm:min-w-0 sm:flex-1">
        <label for="exercise-search" class="sr-only">{{ t('exercises.toolbar.search') }}</label>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        <input
          id="exercise-search"
          v-model="searchTerm"
          type="search"
          :placeholder="t('exercises.toolbar.searchPlaceholder')"
          :class="[field, 'w-full pl-8 sm:max-w-xs']"
          @input="emit('search', searchTerm)"
        />
      </div>

      <div class="flex items-center gap-2">
        <label for="exercise-equipment" :class="label">{{ t('exercises.toolbar.equipment') }}</label>
        <select
          id="exercise-equipment"
          :value="filters.equipment"
          :class="field"
          @change="emit('equipment', ($event.target as HTMLSelectElement).value as Equipment | '')"
        >
          <option value="">{{ t('exercises.toolbar.all') }}</option>
          <option v-for="item in EQUIPMENT_ORDER" :key="item" :value="item">{{ EQUIPMENT_LABELS[item] }}</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="exercise-kind" :class="label">{{ t('exercises.toolbar.kind') }}</label>
        <select
          id="exercise-kind"
          :value="filters.kind"
          :class="field"
          @change="emit('kind', ($event.target as HTMLSelectElement).value as ExerciseKind | '')"
        >
          <option value="">{{ t('exercises.toolbar.all') }}</option>
          <option v-for="item in KIND_ORDER" :key="item" :value="item">{{ KIND_LABELS[item] }}</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="exercise-sort" :class="label">{{ t('exercises.toolbar.sort') }}</label>
        <select
          id="exercise-sort"
          :value="filters.sortBy"
          :class="field"
          @change="emit('sortBy', ($event.target as HTMLSelectElement).value as ExerciseSortBy)"
        >
          <option v-for="item in SORTS" :key="item.value" :value="item.value">{{ t(item.key) }}</option>
        </select>
      </div>

      <label class="flex items-center gap-2 text-xs text-zinc-400">
        <input
          type="checkbox"
          class="h-3.5 w-3.5 accent-blue-600"
          :checked="filters.hideNeverPerformed"
          @change="emit('toggleHideNeverPerformed')"
        />
        {{ t('exercises.toolbar.hideNever') }}
      </label>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
        :class="focus"
        @click="emit('clear')"
      >
        {{ t('common.clearFilters') }}
      </button>
    </div>

    <div class="flex flex-wrap gap-1.5" role="group" :aria-label="t('exercises.toolbar.filterMuscle')">
      <button
        v-for="group in MUSCLE_ORDER"
        :key="group"
        type="button"
        class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors"
        :class="[
          focus,
          filters.muscleGroups.includes(group)
            ? 'border-zinc-600 bg-zinc-800 text-white'
            : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
        ]"
        :aria-pressed="filters.muscleGroups.includes(group)"
        @click="emit('toggleMuscle', group)"
      >
        <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: MUSCLE_STYLES[group].hex }" aria-hidden="true" />
        {{ MUSCLE_LABELS[group] }}
      </button>
    </div>
  </div>
</template>
