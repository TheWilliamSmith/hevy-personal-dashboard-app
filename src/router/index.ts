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
  {
    path: '/sign-in',
    name: 'sign-in',
    component: () => import('@/views/auth/SignInView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/sign-up',
    name: 'sign-up',
    component: () => import('@/views/auth/SignUpView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { layout: 'auth' },
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
