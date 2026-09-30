// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { router, sessionExpiredTarget } from '@/router';

describe('sessionExpiredTarget', () => {
  it('sends back to the page that was open', () => {
    expect(sessionExpiredTarget(router.resolve('/?tab=workouts&page=2'))).toEqual({
      name: 'sign-in',
      query: { reason: 'expired', redirect: '/?tab=workouts&page=2' },
    });
  });

  it('adds no redirect for the home page or an auth page', () => {
    expect(sessionExpiredTarget(router.resolve('/'))).toEqual({ name: 'sign-in', query: { reason: 'expired' } });
    expect(sessionExpiredTarget(router.resolve('/reset-password?token=x'))).toEqual({
      name: 'sign-in',
      query: { reason: 'expired' },
    });
  });
});
