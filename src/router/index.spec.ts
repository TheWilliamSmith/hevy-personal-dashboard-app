// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { legacyTabRedirect, router } from './index';

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
