import {
  createRouter,
  createWebHistory,
  type LocationQuery,
  type RouteLocationRaw,
  type RouteRecordRaw,
} from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  { path: '/data', redirect: () => ({ name: 'home', query: { tab: 'settings', section: 'data' } }) },
  { path: '/imports', redirect: () => ({ name: 'home', query: { tab: 'settings', section: 'data' } }) },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export function legacyTabRedirect(query: LocationQuery): RouteLocationRaw | null {
  if (query.tab === 'imports' || query.tab === 'data') {
    return { name: 'home', query: { ...query, tab: 'settings', section: 'data' } };
  }
  return null;
}

router.beforeEach((to) => legacyTabRedirect(to.query) ?? true);
