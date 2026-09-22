<script setup lang="ts">
import { RouterLink } from 'vue-router';

import ExerciseCard from '@/components/exercises/ExerciseCard.vue';
import ExerciseToolbar from '@/components/exercises/ExerciseToolbar.vue';
import { useExercises } from '@/composables/useExercises';
import { MUSCLE_LABELS, MUSCLE_STYLES } from '@/constants/muscles';
import { formatInteger } from '@/utils/format';

const {
  groups,
  totals,
  filters,
  isLoading,
  error,
  hasActiveFilters,
  isEmptyCatalog,
  setSearch,
  toggleMuscle,
  setEquipment,
  setKind,
  setSortBy,
  toggleHideNeverPerformed,
  clearFilters,
  refresh,
} = useExercises();

/** Anchors are ids on the section, so the rail is plain in-page navigation. */
function anchorId(group: string): string {
  return `muscle-${group.toLowerCase()}`;
}
</script>

<template>
  <div>
    <div class="px-4 pt-2 sm:px-6">
      <h1 class="mb-3 text-2xl font-semibold text-slate-900">Exercises</h1>
    </div>

    <ExerciseToolbar
      :filters="filters"
      :has-active-filters="hasActiveFilters"
      @search="setSearch"
      @toggle-muscle="toggleMuscle"
      @equipment="setEquipment"
      @kind="setKind"
      @sort-by="setSortBy"
      @toggle-hide-never-performed="toggleHideNeverPerformed"
      @clear="clearFilters"
    />

    <div class="flex gap-6 px-4 py-4 sm:px-6">
      <!-- Jump-to-group rail, desktop only. -->
      <nav
        v-if="groups.length > 1"
        class="sticky top-32 hidden h-fit w-40 shrink-0 flex-col gap-0.5 lg:flex"
        aria-label="Jump to muscle group"
      >
        <a
          v-for="group in groups"
          :key="group.muscleGroup"
          :href="`#${anchorId(group.muscleGroup)}`"
          class="flex items-center justify-between rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <span class="flex min-w-0 items-center gap-1.5">
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :style="{ backgroundColor: MUSCLE_STYLES[group.muscleGroup].hex }"
              aria-hidden="true"
            />
            <span class="truncate">{{ MUSCLE_LABELS[group.muscleGroup] }}</span>
          </span>
          <span class="text-slate-400">{{ group.exerciseCount }}</span>
        </a>
      </nav>

      <div class="min-w-0 flex-1">
        <div v-if="isLoading" class="flex flex-col gap-6" aria-busy="true">
          <div v-for="section in 2" :key="section">
            <div class="mb-3 h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              <div v-for="card in 10" :key="card" class="h-36 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>

        <div
          v-else-if="error"
          class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
          role="alert"
        >
          <p class="text-sm text-red-900">{{ error }}</p>
          <button
            type="button"
            class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="refresh"
          >
            Retry
          </button>
        </div>

        <!-- No exercises at all: the catalog is built from imports. -->
        <div
          v-else-if="isEmptyCatalog"
          class="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center"
        >
          <p class="text-slate-700">No exercises yet.</p>
          <RouterLink
            :to="{ name: 'home', query: { tab: 'imports' } }"
            class="mt-3 inline-block text-sm font-medium text-indigo-700 underline underline-offset-2"
          >
            Import your Hevy export
          </RouterLink>
        </div>

        <!-- Exercises exist, but this filter combination matches none. -->
        <div
          v-else-if="groups.length === 0"
          class="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center"
        >
          <p class="text-slate-700">No exercises match these filters.</p>
          <button
            type="button"
            class="mt-3 text-sm font-medium text-indigo-700 underline underline-offset-2"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>

        <div v-else class="flex flex-col gap-8">
          <section
            v-for="group in groups"
            :id="anchorId(group.muscleGroup)"
            :key="group.muscleGroup"
            class="scroll-mt-32"
          >
            <header
              class="sticky top-[7.5rem] z-10 mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-slate-200 bg-slate-100/95 py-2 backdrop-blur"
            >
              <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :style="{ backgroundColor: MUSCLE_STYLES[group.muscleGroup].hex }"
                  aria-hidden="true"
                />
                {{ MUSCLE_LABELS[group.muscleGroup] }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ formatInteger(group.exerciseCount) }} exercises
                <span aria-hidden="true"> · </span>
                {{ formatInteger(group.totalSets) }} sets
              </p>
            </header>

            <div
              class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              <ExerciseCard
                v-for="exercise in group.exercises"
                :key="exercise.id"
                :exercise="exercise"
              />
            </div>
          </section>

          <p v-if="totals" class="pb-4 text-center text-xs text-slate-500">
            {{ formatInteger(totals.performed) }} performed
            <span aria-hidden="true"> · </span>
            {{ formatInteger(totals.neverPerformed) }} never performed
            <span aria-hidden="true"> · </span>
            {{ formatInteger(totals.exercises) }} total
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
