import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => {
    if (saved) {
      return saved;
    }
    const changedView =
      to.query.tab !== from.query.tab ||
      to.query.workout !== from.query.workout ||
      to.query.exercise !== from.query.exercise;
    return changedView ? { top: 0 } : false;
  },
});
