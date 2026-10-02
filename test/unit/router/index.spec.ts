// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { authRedirect, legacyTabRedirect, router } from '@/router/index';

describe('the app router', () => {
  it('registers the single home route plus a catch-all redirect', () => {
    expect(router.resolve('/').name).toBe('home');
    expect(router.resolve('/anything/else').matched[0]?.redirect).toEqual({ name: 'home' });
  });

  it.each(['data', 'imports'])('sends the legacy %s tab to the data section of settings', (legacy) => {
    expect(legacyTabRedirect({ tab: legacy, page: '2' })).toEqual({
      name: 'home',
      query: { tab: 'settings', section: 'data', page: '2' },
    });
  });

  it.each([
    ['/sign-in', 'sign-in'],
    ['/sign-up', 'sign-up'],
    ['/forgot-password', 'forgot-password'],
    ['/reset-password', 'reset-password'],
  ])('serves %s outside the app shell', (path, name) => {
    const resolved = router.resolve(path);
    expect(resolved.name).toBe(name);
    expect(resolved.meta.layout).toBe('auth');
  });

  it('leaves every other tab alone', () => {
    expect(legacyTabRedirect({ tab: 'workouts' })).toBeNull();
  });
});

describe('authRedirect', () => {
  const at = (path: string) => router.resolve(path);

  it('sends a signed-out visitor to sign-in, remembering where they were going', () => {
    expect(authRedirect(at('/?tab=workouts'), false)).toEqual({
      name: 'sign-in',
      query: { redirect: '/?tab=workouts' },
    });
    expect(authRedirect(at('/'), false)).toEqual({ name: 'sign-in', query: {} });
  });

  it.each(['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/recap/unsubscribe?token=x'])(
    'lets a signed-out visitor open %s',
    (path) => {
      expect(authRedirect(at(path), false)).toBeNull();
    },
  );

  it.each(['/sign-in', '/sign-up'])('sends a signed-in user away from %s', (path) => {
    expect(authRedirect(at(path), true)).toEqual({ name: 'home' });
  });

  it.each(['/?tab=settings', '/forgot-password', '/recap/unsubscribe?token=x'])('lets a signed-in user open %s', (path) => {
    expect(authRedirect(at(path), true)).toBeNull();
  });
});
