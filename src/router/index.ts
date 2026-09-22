import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

/**
 * A single page. The tab and every filter are query parameters, so the URL is
 * the complete description of what is on screen — see useActiveTab.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  // Old deep links (/dashboard, /workouts/:id, …) and typos land on the page.
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  /**
   * Every navigation now shares one path, so the old path comparison would
   * never scroll. Changing tab or opening a workout is a new view and goes to
   * the top; a filter change keeps the reader where they were.
   */
  scrollBehavior: (to, from, saved) => {
    if (saved) {
      return saved;
    }
    const changedView =
      to.query.tab !== from.query.tab || to.query.workout !== from.query.workout;
    return changedView ? { top: 0 } : false;
  },
});
