import {
  createRouter,
  createWebHistory,
  type LocationQuery,
  type RouteLocationNormalized,
  type RouteLocationRaw,
  type RouteRecordRaw,
} from 'vue-router';

import { loadSession } from '@/lib/auth-session';

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
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('@/views/auth/VerifyEmailView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/recap/unsubscribe',
    name: 'recap-unsubscribe',
    component: () => import('@/views/auth/RecapUnsubscribeView.vue'),
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

const GUEST_ONLY = new Set(['sign-in', 'sign-up']);

type RouteTarget = Pick<RouteLocationNormalized, 'meta' | 'fullPath'> & { name?: unknown };

export function authRedirect(to: RouteTarget, signedIn: boolean): RouteLocationRaw | null {
  if (signedIn) {
    return typeof to.name === 'string' && GUEST_ONLY.has(to.name) ? { name: 'home' } : null;
  }
  if (to.meta.layout === 'auth') {
    return null;
  }
  return { name: 'sign-in', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } };
}

router.beforeEach((to) => legacyTabRedirect(to.query) ?? authRedirect(to, loadSession() !== null) ?? true);

export function sessionExpiredTarget(to: RouteTarget): RouteLocationRaw {
  const query: Record<string, string> = { reason: 'expired' };
  if (to.meta.layout !== 'auth' && to.fullPath !== '/') {
    query.redirect = to.fullPath;
  }
  return { name: 'sign-in', query };
}
