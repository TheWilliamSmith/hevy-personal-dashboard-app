// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse } from '@/test/router-harness';
import type { AuthSession } from '@/types/auth';

const USER = {
  id: 'u1',
  email: 'alex@example.com',
  username: 'alex.lifts',
  displayName: 'Alex',
  createdAt: '2025-12-01T00:00:00Z',
};

function session(): AuthSession {
  return { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: USER };
}

async function freshAuth() {
  vi.resetModules();
  const { useAuth } = await import('@/composables/useAuth');
  return useAuth();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useAuth', () => {
  it('signs in, stores the session and sends the token afterwards', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      String(url).endsWith('/auth/sign-in') ? jsonResponse(session()) : jsonResponse(USER),
    );
    vi.stubGlobal('fetch', fetchMock);
    const auth = await freshAuth();

    await auth.signIn('alex@example.com', 'Str0ng-pass', true);

    expect(auth.user.value).toEqual(USER);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      email: 'alex@example.com',
      password: 'Str0ng-pass',
      remember: true,
    });

    await auth.restore();
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer token-1' });
  });

  it('surfaces the API message on a failed sign-in and stays signed out', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Invalid email or password.' }, 401)));
    const auth = await freshAuth();

    await expect(auth.signIn('alex@example.com', 'wrong', false)).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    });
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.isSubmitting.value).toBe(false);
  });

  it('signs up with display name, username, email and password', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(session(), 201));
    vi.stubGlobal('fetch', fetchMock);
    const auth = await freshAuth();
    const account = { displayName: 'Alex', username: 'alex.lifts', email: 'alex@example.com', password: 'Str0ng-pass' };

    await auth.signUp(account);

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/auth/sign-up');
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toEqual(account);
    expect(auth.user.value).toEqual(USER);
  });

  it('keeps the conflict body so the form can tell which field is taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ statusCode: 409, message: 'This username is already taken.', field: 'username' }, 409)),
    );
    const auth = await freshAuth();

    await expect(
      auth.signUp({ displayName: 'Alex', username: 'alex.lifts', email: 'alex@example.com', password: 'Str0ng-pass' }),
    ).rejects.toMatchObject({ status: 409, body: { field: 'username' } });
  });

  it('signs out when the stored token is refused', async () => {
    sessionStorage.setItem('hevy-dashboard.session', JSON.stringify(session()));
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Invalid or expired token.' }, 401)));
    const auth = await freshAuth();
    expect(auth.isAuthenticated.value).toBe(true);

    await auth.restore();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(sessionStorage.getItem('hevy-dashboard.session')).toBeNull();
  });

  it('keeps the session when the API cannot be reached', async () => {
    sessionStorage.setItem('hevy-dashboard.session', JSON.stringify(session()));
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));
    const auth = await freshAuth();

    await auth.restore();

    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('signs out locally', async () => {
    sessionStorage.setItem('hevy-dashboard.session', JSON.stringify(session()));
    const auth = await freshAuth();

    auth.signOut();

    expect(auth.user.value).toBeNull();
    expect(sessionStorage.getItem('hevy-dashboard.session')).toBeNull();
  });

  it('refuses OAuth until a provider is wired', async () => {
    vi.useFakeTimers();
    const auth = await freshAuth();

    const attempt = auth.signInWith('google');
    const assertion = expect(attempt).rejects.toThrow('Google sign-in is not available yet');
    await vi.runAllTimersAsync();
    await assertion;

    expect(auth.pendingProvider.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
  });
});
