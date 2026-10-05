// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse } from '../../support/router-harness';
import type { AuthSession } from '@/types/auth';

const STORAGE_KEY = 'hevy-dashboard.session';

function storeSession(): void {
  const session: AuthSession = {
    accessToken: 'token-1',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
    user: { id: 'u1', email: 'a@example.com', username: 'a.b', displayName: 'A', createdAt: '2026-01-01T00:00:00Z', emailVerified: true, pendingEmail: null },
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function freshModules() {
  vi.resetModules();
  const expiry = await import('@/lib/session-expiry');
  const api = await import('@/lib/api');
  const listener = vi.fn();
  expiry.onSessionExpired(listener);
  return { ...expiry, ...api, listener };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => vi.unstubAllGlobals());

describe('session expiry', () => {
  it('notifies once, however many calls fail together', async () => {
    const { notifySessionExpired, listener } = await freshModules();

    notifySessionExpired();
    notifySessionExpired();

    expect(listener).toHaveBeenCalledOnce();
  });

  it('does nothing without a listener', async () => {
    vi.resetModules();
    const { notifySessionExpired } = await import('@/lib/session-expiry');

    expect(() => notifySessionExpired()).not.toThrow();
  });

  it.each([
    ['/auth/sign-in', true],
    ['/auth/sign-up', true],
    ['/auth/password/reset', true],
    ['/auth/me', false],
    ['/workouts', false],
  ])('treats %s as a public auth path: %s', async (path, expected) => {
    const { isPublicAuthPath } = await freshModules();

    expect(isPublicAuthPath(path)).toBe(expected);
  });
});

describe('api calls', () => {
  it('reports a 401 on a call that carried a token', async () => {
    storeSession();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Invalid or expired token.' }, 401)));
    const { apiGet, listener } = await freshModules();

    await expect(apiGet('/workouts')).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledOnce();
  });

  it('ignores a 401 when no token was sent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Missing bearer token.' }, 401)));
    const { apiGet, listener } = await freshModules();

    await expect(apiGet('/workouts')).rejects.toMatchObject({ status: 401 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('ignores a wrong password on sign-in, even with a stored session', async () => {
    storeSession();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Invalid email or password.' }, 401)));
    const { apiPost, listener } = await freshModules();

    await expect(apiPost('/auth/sign-in', {})).rejects.toMatchObject({ status: 401 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('ignores other errors', async () => {
    storeSession();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Not found.' }, 404)));
    const { apiPatch, listener } = await freshModules();

    await expect(apiPatch('/exercises/x', {})).rejects.toMatchObject({ status: 404 });

    expect(listener).not.toHaveBeenCalled();
  });
});
