import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'workouts' } },
  {
    path: '/workouts',
    name: 'workouts',
    component: () => import('@/views/WorkoutsView.vue'),
  },
  {
    path: '/workouts/:id',
    name: 'workout-detail',
    component: () => import('@/views/WorkoutDetailView.vue'),
  },
  {
    path: '/import',
    name: 'import',
    component: () => import('@/views/ImportView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  /** A filter change must not drop the reader back to where they scrolled. */
  scrollBehavior: (to, from, saved) =>
    saved ?? (to.path === from.path ? false : { top: 0 }),
});
