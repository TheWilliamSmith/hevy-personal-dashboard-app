<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import CatalogSpotlight from '@/components/exercises/CatalogSpotlight.vue';
import ExerciseRow from '@/components/exercises/ExerciseRow.vue';
import ExerciseToolbar from '@/components/exercises/ExerciseToolbar.vue';
import TopExercises from '@/components/exercises/TopExercises.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
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

const exercises = computed(() => groups.value.flatMap((group) => group.exercises));
const customCount = computed(() => exercises.value.filter((exercise) => exercise.isCustom).length);

const toolbar = ref<InstanceType<typeof ExerciseToolbar> | null>(null);
const toolbarHeight = ref(0);

let observer: ResizeObserver | null = null;

watch(toolbar, (component) => {
  observer?.disconnect();
  const element = component?.$el as HTMLElement | undefined;
  if (!element) {
    return;
  }
  observer = new ResizeObserver(() => {
    toolbarHeight.value = element.offsetHeight;
  });
  observer.observe(element);
});

onBeforeUnmount(() => observer?.disconnect());

function anchorId(group: string): string {
  return `muscle-${group.toLowerCase()}`;
}
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <TopExercises class="lg:pr-8" :exercises="exercises" :is-loading="isLoading" />
        <CatalogSpotlight
          class="border-zinc-800 lg:border-l lg:pl-8"
          :totals="totals"
          :custom-count="customCount"
          :is-loading="isLoading"
        />
      </div>

      <section class="flex flex-col gap-4">
        <SectionHeader
          title="All exercises"
          :subtitle="`${formatInteger(exercises.length)} exercises listed · grouped by muscle`"
        />

        <ExerciseToolbar
          ref="toolbar"
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

        <div class="flex gap-8" :style="{ '--toolbar-h': `${toolbarHeight}px` }">
          <nav
            v-if="groups.length > 1"
            class="sticky top-[calc(var(--toolbar-h)+0.5rem)] hidden h-fit w-40 shrink-0 flex-col gap-0.5 pt-2 lg:flex"
            aria-label="Jump to muscle group"
          >
            <a
              v-for="group in groups"
              :key="group.muscleGroup"
              :href="`#${anchorId(group.muscleGroup)}`"
              class="flex items-center justify-between rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              <span class="flex min-w-0 items-center gap-1.5">
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :style="{ backgroundColor: MUSCLE_STYLES[group.muscleGroup].hex }"
                  aria-hidden="true"
                />
                <span class="truncate">{{ MUSCLE_LABELS[group.muscleGroup] }}</span>
              </span>
              <span class="text-zinc-600 tabular-nums">{{ group.exerciseCount }}</span>
            </a>
          </nav>

          <div class="min-w-0 flex-1">
            <ul v-if="isLoading && groups.length === 0" class="flex flex-col gap-3 pt-2" aria-busy="true">
              <li v-for="row in 10" :key="row" class="h-12 animate-pulse rounded-md bg-zinc-900" />
            </ul>

            <SectionError v-else-if="error" :message="error" @retry="refresh" />

            <div v-else-if="isEmptyCatalog" class="flex flex-col items-center gap-2 py-16 text-center">
              <p class="text-sm text-zinc-500">No exercises yet.</p>
              <RouterLink
                :to="{ name: 'home', query: { tab: 'data' } }"
                class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2"
              >
                Connect Hevy or import a CSV export
              </RouterLink>
            </div>

            <div v-else-if="groups.length === 0" class="flex flex-col items-center gap-2 py-16 text-center">
              <p class="text-sm text-zinc-500">No exercises match these filters.</p>
              <button
                type="button"
                class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2"
                @click="clearFilters"
              >
                Clear filters
              </button>
            </div>

            <div v-else class="flex flex-col gap-8" :class="{ 'opacity-60 transition-opacity': isLoading }">
              <section
                v-for="group in groups"
                :id="anchorId(group.muscleGroup)"
                :key="group.muscleGroup"
                class="scroll-mt-12 lg:scroll-mt-[calc(var(--toolbar-h)+0.5rem)]"
              >
                <header
                  class="sticky top-0 z-10 flex flex-wrap items-baseline gap-x-3 border-b border-zinc-800 bg-zinc-950/95 py-2 backdrop-blur lg:top-[var(--toolbar-h)]"
                >
                  <h3 class="flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <span
                      class="h-2 w-2 rounded-full"
                      :style="{ backgroundColor: MUSCLE_STYLES[group.muscleGroup].hex }"
                      aria-hidden="true"
                    />
                    {{ MUSCLE_LABELS[group.muscleGroup] }}
                  </h3>
                  <p class="text-xs text-zinc-500">
                    {{ formatInteger(group.exerciseCount) }} exercises · {{ formatInteger(group.totalSets) }} sets
                  </p>
                </header>

                <ul>
                  <ExerciseRow v-for="exercise in group.exercises" :key="exercise.id" :exercise="exercise" />
                </ul>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
