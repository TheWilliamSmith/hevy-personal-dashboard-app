<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';

import { useActiveTab } from '@/composables/useActiveTab';

const DashboardPanel = defineAsyncComponent(() => import('@/views/DashboardView.vue'));
const WorkoutsPanel = defineAsyncComponent(() => import('@/views/WorkoutsView.vue'));
const WorkoutDetailPanel = defineAsyncComponent(() => import('@/views/WorkoutDetailView.vue'));
const WorkoutComparePanel = defineAsyncComponent(() => import('@/views/WorkoutCompareView.vue'));
const SettingsPanel = defineAsyncComponent(() => import('@/views/SettingsView.vue'));
const BodyPanel = defineAsyncComponent(() => import('@/views/BodyView.vue'));
const ProgressPanel = defineAsyncComponent(() => import('@/views/ProgressView.vue'));
const GoalsPanel = defineAsyncComponent(() => import('@/views/GoalsView.vue'));
const TrophiesPanel = defineAsyncComponent(() => import('@/views/TrophyRoomView.vue'));
const ExercisesPanel = defineAsyncComponent(() => import('@/views/ExercisesView.vue'));
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

const panel = computed(() => {
  if (tab.value === 'settings') {
    return SettingsPanel;
  }
  if (tab.value === 'body') {
    return BodyPanel;
  }
  if (tab.value === 'progress') {
    return ProgressPanel;
  }
  if (tab.value === 'goals') {
    return GoalsPanel;
  }
  if (tab.value === 'trophies') {
    return TrophiesPanel;
  }
  if (tab.value === 'workouts') {
    if (!workoutId.value) {
      return WorkoutsPanel;
    }
    return compareId.value ? WorkoutComparePanel : WorkoutDetailPanel;
  }
  if (tab.value === 'friends') {
    return username.value ? UserPagePanel : FriendsPanel;
  }
  if (tab.value === 'exercises') {
    return exerciseSlug.value ? ExerciseDetailPanel : ExercisesPanel;
  }
  return DashboardPanel;
});
</script>

<template>
  <component :is="panel" :key="`${tab}-${workoutId}-${compareId}-${exerciseSlug}-${username}`" />
</template>
