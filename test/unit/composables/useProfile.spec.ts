// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '../../support/router-harness';
import type { ProfileResponse } from '@/types/profile';

const USER = { id: 'u1', email: 'alex@example.com', username: 'alex.lifts', displayName: 'Alex', createdAt: '2026-01-01T00:00:00Z' };

function profileResponse(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    displayName: 'Alex',
    username: 'alex.lifts',
    email: 'alex@example.com',
    avatarUrl: null,
    bio: 'Push / pull / legs.',
    location: 'Lille',
    memberSince: '2026-01-01T00:00:00Z',
    weightUnit: 'kg',
    weekStart: 'monday',
    bodyweightKg: 78,
    heightCm: 180,
    stats: { workouts: 12, level: 3, trophies: 5, streakWeeks: 2 },
    ...overrides,
  };
}

async function freshProfile(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  vi.resetModules();
  const { useProfile } = await import('@/composables/useProfile');
  const { useAuth } = await import('@/composables/useAuth');
  const profile = useProfile();
  await flushPromises();
  return { profile, auth: useAuth() };
}

beforeEach(() => {
  sessionStorage.setItem(
    'hevy-dashboard.session',
    JSON.stringify({ accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: USER }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('useProfile', () => {
  it('loads the saved profile and stats for the signed-in user', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(profileResponse()));
    const { profile } = await freshProfile(fetchMock);

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/me/profile');
    expect(profile.profile.value).toMatchObject({ bio: 'Push / pull / legs.', bodyweightKg: 78 });
    expect(profile.stats.value).toEqual({ workouts: 12, level: 3, trophies: 5, streakWeeks: 2 });
  });

  it('points the avatar at the API', async () => {
    const { profile } = await freshProfile(
      vi.fn(async () => jsonResponse(profileResponse({ avatarUrl: '/users/u1/avatar?v=1' }))),
    );

    expect(profile.profile.value?.avatarUrl).toBe('/api/users/u1/avatar?v=1');
  });

  it('shows the account name before the profile arrives', async () => {
    const { profile } = await freshProfile(vi.fn(() => new Promise<Response>(() => undefined)));

    expect(profile.profile.value).toMatchObject({ displayName: 'Alex', username: 'alex.lifts', bio: '' });
    expect(profile.stats.value).toBeNull();
  });

  it('saves changes and carries a new name over to the session', async () => {
    const responses = [jsonResponse(profileResponse()), jsonResponse(profileResponse({ displayName: 'Alex Martin', username: 'alex.martin' }))];
    const fetchMock = vi.fn(async (..._args: unknown[]) => responses.shift() ?? jsonResponse({}));
    const { profile, auth } = await freshProfile(fetchMock);

    await profile.save({ displayName: 'Alex Martin', username: 'alex.martin' });

    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'PATCH' });
    expect(auth.user.value).toMatchObject({ displayName: 'Alex Martin', username: 'alex.martin' });
    expect(JSON.parse(sessionStorage.getItem('hevy-dashboard.session') ?? '{}').user.username).toBe('alex.martin');
  });

  it('uploads the picture as a form and removes it', async () => {
    const responses = [
      jsonResponse(profileResponse()),
      jsonResponse(profileResponse({ avatarUrl: '/users/u1/avatar?v=2' }), 201),
      jsonResponse(profileResponse()),
    ];
    const fetchMock = vi.fn(async (..._args: unknown[]) => responses.shift() ?? jsonResponse({}));
    const { profile } = await freshProfile(fetchMock);

    await profile.uploadAvatar(new File([new Uint8Array([1, 2, 3])], 'me.png', { type: 'image/png' }));
    const init = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).not.toHaveProperty('Content-Type');
    expect(profile.profile.value?.avatarUrl).toBe('/api/users/u1/avatar?v=2');

    await profile.removeAvatar();
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: 'DELETE' });
    expect(profile.profile.value?.avatarUrl).toBeNull();
  });

  it('reports a load error', async () => {
    const { profile } = await freshProfile(vi.fn(async () => jsonResponse({ message: 'boom' }, 500)));

    expect(profile.error.value).toBe('The server failed to answer. Try again in a moment.');
  });
});
