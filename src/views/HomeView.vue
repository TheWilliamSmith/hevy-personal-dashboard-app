<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';

import { useActiveTab } from '@/composables/useActiveTab';

const DashboardPanel = defineAsyncComponent(() => import('@/views/DashboardView.vue'));
const WorkoutsPanel = defineAsyncComponent(() => import('@/views/WorkoutsView.vue'));
const WorkoutDetailPanel = defineAsyncComponent(() => import('@/views/WorkoutDetailView.vue'));
const DataPanel = defineAsyncComponent(() => import('@/views/DataView.vue'));
const BodyPanel = defineAsyncComponent(() => import('@/views/BodyView.vue'));
const ProgressPanel = defineAsyncComponent(() => import('@/views/ProgressView.vue'));
const TrophiesPanel = defineAsyncComponent(() => import('@/views/TrophyRoomView.vue'));
const ExercisesPanel = defineAsyncComponent(() => import('@/views/ExercisesView.vue'));
const ExerciseDetailPanel = defineAsyncComponent(() => import('@/views/ExerciseDetailView.vue'));

const route = useRoute();
const { tab } = useActiveTab();

const workoutId = computed(() =>
  typeof route.query.workout === 'string' ? route.query.workout : '',
);

const exerciseSlug = computed(() =>
  typeof route.query.exercise === 'string' ? route.query.exercise : '',
);

const panel = computed(() => {
  if (tab.value === 'data') {
    return DataPanel;
  }
  if (tab.value === 'body') {
    return BodyPanel;
  }
  if (tab.value === 'progress') {
    return ProgressPanel;
  }
  if (tab.value === 'trophies') {
    return TrophiesPanel;
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
  <component :is="panel" :key="`${tab}-${workoutId}-${exerciseSlug}`" />
</template>
