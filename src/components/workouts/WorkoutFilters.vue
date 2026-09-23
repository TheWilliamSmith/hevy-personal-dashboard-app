<script setup lang="ts">
import { ref, watch } from 'vue';

import type { ExerciseOption, WorkoutFilters } from '@/types/workouts';

const props = defineProps<{
  filters: WorkoutFilters;
  exercises: ExerciseOption[];
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  search: [value: string];
  exercise: [value: string];
  dateRange: [from: string, to: string];
  clear: [];
}>();

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
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none';
</script>

<template>
  <form class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent>
    <div class="lg:col-span-2">
      <label for="workout-search" class="mb-1 block text-xs font-medium text-slate-600">Search</label>
      <input
        id="workout-search"
        v-model="searchTerm"
        type="search"
        placeholder="Workout title"
        :class="field"
        @input="emit('search', searchTerm)"
      />
    </div>

    <div>
      <label for="workout-exercise" class="mb-1 block text-xs font-medium text-slate-600">Exercise</label>
      <select
        id="workout-exercise"
        :value="props.filters.exercise"
        :class="field"
        @change="emit('exercise', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">All exercises</option>
        <option v-for="option in props.exercises" :key="option.name" :value="option.name">
          {{ option.name }} ({{ option.workoutCount }})
        </option>
      </select>
    </div>

    <div>
      <label for="workout-from" class="mb-1 block text-xs font-medium text-slate-600">From</label>
      <input
        id="workout-from"
        type="date"
        :value="props.filters.from"
        :max="props.filters.to || undefined"
        :class="field"
        @change="emit('dateRange', ($event.target as HTMLInputElement).value, props.filters.to)"
      />
    </div>

    <div>
      <label for="workout-to" class="mb-1 block text-xs font-medium text-slate-600">To</label>
      <input
        id="workout-to"
        type="date"
        :value="props.filters.to"
        :min="props.filters.from || undefined"
        :class="field"
        @change="emit('dateRange', props.filters.from, ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div v-if="props.hasActiveFilters" class="sm:col-span-2 lg:col-span-5">
      <button
        type="button"
        class="text-sm font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
        @click="emit('clear')"
      >
        Clear all filters
      </button>
    </div>
  </form>
</template>
