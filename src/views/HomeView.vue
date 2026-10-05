<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue';
import { useRoute } from 'vue-router';

import { useActiveTab, type TabName } from '@/composables/useActiveTab';

const DashboardPanel = defineAsyncComponent(() => import('@/views/DashboardView.vue'));
const WorkoutsPanel = defineAsyncComponent(() => import('@/views/WorkoutsView.vue'));
const WorkoutDetailPanel = defineAsyncComponent(() => import('@/views/WorkoutDetailView.vue'));
const WorkoutComparePanel = defineAsyncComponent(() => import('@/views/WorkoutCompareView.vue'));
const SettingsPanel = defineAsyncComponent(() => import('@/views/SettingsView.vue'));
const BodyPanel = defineAsyncComponent(() => import('@/views/BodyView.vue'));
const MeasurementsPanel = defineAsyncComponent(() => import('@/views/MeasurementsView.vue'));
const ProgressPanel = defineAsyncComponent(() => import('@/views/ProgressView.vue'));
const GoalsPanel = defineAsyncComponent(() => import('@/views/GoalsView.vue'));
const TrophiesPanel = defineAsyncComponent(() => import('@/views/TrophyRoomView.vue'));
const ExercisesPanel = defineAsyncComponent(() => import('@/views/ExercisesView.vue'));
const CalculatorsPanel = defineAsyncComponent(() => import('@/views/CalculatorsView.vue'));
const ExerciseDetailPanel = defineAsyncComponent(() => import('@/views/ExerciseDetailView.vue'));
const FriendsPanel = defineAsyncComponent(() => import('@/views/FriendsView.vue'));
const UserPagePanel = defineAsyncComponent(() => import('@/views/UserPageView.vue'));

const route = useRoute();
const { tab } = useActiveTab();

const workoutId = computed(() =>
  typeof route.query.workout === 'string' ? route.query.workout : '',
);

const compareId = computed(() =>
  typeof route.query.compare === 'string' ? route.query.compare : '',
);

const username = computed(() => (typeof route.query.user === 'string' ? route.query.user : ''));

const exerciseSlug = computed(() =>
  typeof route.query.exercise === 'string' ? route.query.exercise : '',
);

const PANELS: Partial<Record<TabName, Component>> = {
  settings: SettingsPanel,
  body: BodyPanel,
  measurements: MeasurementsPanel,
  calculators: CalculatorsPanel,
  progress: ProgressPanel,
  goals: GoalsPanel,
  trophies: TrophiesPanel,
};

function workoutsPanel(): Component {
  if (!workoutId.value) {
    return WorkoutsPanel;
  }
  return compareId.value ? WorkoutComparePanel : WorkoutDetailPanel;
}

const panel = computed<Component>(() => {
  switch (tab.value) {
    case 'workouts':
      return workoutsPanel();
    case 'friends':
      return username.value ? UserPagePanel : FriendsPanel;
    case 'exercises':
      return exerciseSlug.value ? ExerciseDetailPanel : ExercisesPanel;
    default:
      return PANELS[tab.value] ?? DashboardPanel;
  }
});
</script>

<template>
  <component :is="panel" :key="`${tab}-${workoutId}-${compareId}-${exerciseSlug}-${username}`" />
</template>
