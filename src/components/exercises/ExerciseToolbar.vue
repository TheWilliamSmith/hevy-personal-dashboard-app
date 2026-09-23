<script setup lang="ts">
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

const SORTS: ReadonlyArray<{ value: ExerciseSortBy; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'volume', label: 'Volume' },
  { value: 'lastPerformed', label: 'Last performed' },
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

const field =
  'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none';
</script>

<template>
  <div
    class="sticky top-0 z-20 flex flex-col gap-3 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:px-6"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
        <label for="exercise-search" class="sr-only">Search exercises</label>
        <input
          id="exercise-search"
          v-model="searchTerm"
          type="search"
          placeholder="Search exercises…"
          :class="[field, 'w-full sm:max-w-xs']"
          @input="emit('search', searchTerm)"
        />
      </div>

      <div class="flex items-center gap-2">
        <label for="exercise-equipment" class="text-xs font-medium text-slate-600">Equipment</label>
        <select
          id="exercise-equipment"
          :value="props.filters.equipment"
          :class="field"
          @change="emit('equipment', ($event.target as HTMLSelectElement).value as Equipment | '')"
        >
          <option value="">All</option>
          <option v-for="item in EQUIPMENT_ORDER" :key="item" :value="item">
            {{ EQUIPMENT_LABELS[item] }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="exercise-kind" class="text-xs font-medium text-slate-600">Kind</label>
        <select
          id="exercise-kind"
          :value="props.filters.kind"
          :class="field"
          @change="emit('kind', ($event.target as HTMLSelectElement).value as ExerciseKind | '')"
        >
          <option value="">All</option>
          <option v-for="item in KIND_ORDER" :key="item" :value="item">
            {{ KIND_LABELS[item] }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="exercise-sort" class="text-xs font-medium text-slate-600">Sort</label>
        <select
          id="exercise-sort"
          :value="props.filters.sortBy"
          :class="field"
          @change="emit('sortBy', ($event.target as HTMLSelectElement).value as ExerciseSortBy)"
        >
          <option v-for="item in SORTS" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>

      <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input
          type="checkbox"
          :checked="props.filters.hideNeverPerformed"
          @change="emit('toggleHideNeverPerformed')"
        />
        Hide never performed
      </label>

      <button
        v-if="props.hasActiveFilters"
        type="button"
        class="text-xs font-medium text-indigo-700 underline underline-offset-2"
        @click="emit('clear')"
      >
        Clear filters
      </button>
    </div>

    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by muscle group">
      <button
        v-for="group in MUSCLE_ORDER"
        :key="group"
        type="button"
        class="rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors ring-inset"
        :class="
          props.filters.muscleGroups.includes(group)
            ? MUSCLE_STYLES[group].chip + ' ring-2'
            : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
        "
        :aria-pressed="props.filters.muscleGroups.includes(group)"
        @click="emit('toggleMuscle', group)"
      >
        {{ MUSCLE_LABELS[group] }}
      </button>
    </div>
  </div>
</template>
