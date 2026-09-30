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
});

router.beforeEach((to) => {
  if (to.query.tab === 'imports') {
    return { name: 'home', query: { ...to.query, tab: 'data' } };
  }
  return true;
});
