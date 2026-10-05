<script setup lang="ts">
import { t } from '@/i18n';
import { Search } from 'lucide-vue-next';
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
  'w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const label = 'mb-1 block text-xs text-zinc-400';
</script>

<template>
  <form class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_repeat(2,minmax(0,1fr))_auto] lg:items-end" @submit.prevent>
    <div>
      <label for="workout-search" :class="label">{{ t('workouts.search') }}</label>
      <div class="relative">
        <Search class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        <input
          id="workout-search"
          v-model="searchTerm"
          type="search"
          :placeholder="t('workouts.searchPlaceholder')"
          :class="[field, 'pl-8']"
          @input="emit('search', searchTerm)"
        />
      </div>
    </div>

    <div>
      <label for="workout-exercise" :class="label">{{ t('workouts.exercise') }}</label>
      <select
        id="workout-exercise"
        :value="filters.exercise"
        :class="field"
        @change="emit('exercise', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ t('workouts.allExercises') }}</option>
        <option v-for="option in exercises" :key="option.name" :value="option.name">
          {{ option.name }} ({{ option.workoutCount }})
        </option>
      </select>
    </div>

    <div>
      <label for="workout-from" :class="label">{{ t('workouts.from') }}</label>
      <input
        id="workout-from"
        type="date"
        :value="filters.from"
        :max="filters.to || undefined"
        :class="field"
        @change="emit('dateRange', ($event.target as HTMLInputElement).value, filters.to)"
      />
    </div>

    <div>
      <label for="workout-to" :class="label">{{ t('workouts.to') }}</label>
      <input
        id="workout-to"
        type="date"
        :value="filters.to"
        :min="filters.from || undefined"
        :class="field"
        @change="emit('dateRange', filters.from, ($event.target as HTMLInputElement).value)"
      />
    </div>

    <button
      v-if="hasActiveFilters"
      type="button"
      class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:justify-self-start lg:mb-0.5"
      @click="emit('clear')"
    >
      {{ t('common.clearFilters') }}
    </button>
  </form>
</template>
