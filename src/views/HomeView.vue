<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';

import { useActiveTab } from '@/composables/useActiveTab';

/**
 * Each panel is async so the three tabs stay in separate chunks — the ECharts
 * bundle is only fetched when the dashboard tab is opened.
 */
const DashboardPanel = defineAsyncComponent(() => import('@/views/DashboardView.vue'));
const WorkoutsPanel = defineAsyncComponent(() => import('@/views/WorkoutsView.vue'));
const WorkoutDetailPanel = defineAsyncComponent(() => import('@/views/WorkoutDetailView.vue'));
const ImportPanel = defineAsyncComponent(() => import('@/views/ImportView.vue'));
const ExercisesPanel = defineAsyncComponent(() => import('@/views/ExercisesView.vue'));
const ExerciseDetailPanel = defineAsyncComponent(() => import('@/views/ExerciseDetailView.vue'));

const route = useRoute();
const { tab } = useActiveTab();

/** `?workout=<id>` opens the detail inside the workouts tab. */
const workoutId = computed(() =>
  typeof route.query.workout === 'string' ? route.query.workout : '',
);

/** `?exercise=<slug>` does the same inside the exercises tab. */
const exerciseSlug = computed(() =>
  typeof route.query.exercise === 'string' ? route.query.exercise : '',
);

const panel = computed(() => {
  if (tab.value === 'imports') {
    return ImportPanel;
  }
  if (tab.value === 'workouts') {
    return workoutId.value ? WorkoutDetailPanel : WorkoutsPanel;
  }
  if (tab.value === 'exercises') {
    return exerciseSlug.value ? ExerciseDetailPanel : ExercisesPanel;
  }
  return DashboardPanel;
});
</script>

<template>
  <!-- Keyed so switching tabs remounts rather than reusing a panel's state. -->
  <component :is="panel" :key="`${tab}-${workoutId}-${exerciseSlug}`" />
</template>
