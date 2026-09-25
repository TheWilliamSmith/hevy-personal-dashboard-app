import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  { path: '/data', redirect: () => ({ name: 'home', query: { tab: 'data' } }) },
  { path: '/imports', redirect: () => ({ name: 'home', query: { tab: 'data' } }) },
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

router.beforeEach((to) => {
  if (to.query.tab === 'imports') {
    return { name: 'home', query: { ...to.query, tab: 'data' } };
  }
  return true;
});
