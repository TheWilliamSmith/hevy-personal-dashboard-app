import { afterEach, describe, expect, it, vi } from 'vitest';

import { availableActions, runFriendAction, useFriends } from '@/composables/useFriends';
import type { UserCard } from '@/types/friends';
import { flushPromises, jsonResponse } from '../../support/router-harness';

function card(overrides: Partial<UserCard> = {}): UserCard {
  return {
    id: 'u2',
    username: 'alex.lifts',
    displayName: 'Alex',
    avatarUrl: null,
    friendship: 'none',
    requestId: null,
    ...overrides,
  };
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): { url: string; method: string; body: unknown } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit | undefined];
  return { url: String(url), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined };
}

afterEach(() => vi.unstubAllGlobals());

describe('availableActions', () => {
  it('offers what makes sense for each friendship state', () => {
    expect(availableActions(card({ friendship: 'none' }))).toEqual(['add']);
    expect(availableActions(card({ friendship: 'outgoing' }))).toEqual(['cancel']);
    expect(availableActions(card({ friendship: 'incoming' }))).toEqual(['accept', 'decline']);
    expect(availableActions(card({ friendship: 'friends' }))).toEqual(['remove']);
    expect(availableActions(card({ friendship: 'self' }))).toEqual([]);
  });
});

describe('runFriendAction', () => {
  it('sends a request by username and returns the new state', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(card({ friendship: 'outgoing', requestId: 'r1' }), 201));
    vi.stubGlobal('fetch', fetchMock);

    const next = await runFriendAction(card(), 'add');

    expect(lastCall(fetchMock)).toEqual({ url: '/api/friends/requests', method: 'POST', body: { username: 'alex.lifts' } });
    expect(next).toMatchObject({ friendship: 'outgoing', requestId: 'r1' });
  });

  it('accepts and declines through the request id', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(card({ friendship: 'friends' })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(runFriendAction(card({ friendship: 'incoming', requestId: 'r9' }), 'accept')).resolves.toMatchObject({
      friendship: 'friends',
    });
    expect(lastCall(fetchMock)).toMatchObject({ url: '/api/friends/requests/r9/accept', method: 'POST' });

    await expect(runFriendAction(card({ friendship: 'incoming', requestId: 'r9' }), 'decline')).resolves.toMatchObject({
      friendship: 'none',
      requestId: null,
    });
    expect(lastCall(fetchMock)).toMatchObject({ url: '/api/friends/requests/r9/decline', method: 'POST' });
  });

  it('cancels a sent request and removes a friend', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 'x' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(runFriendAction(card({ friendship: 'outgoing', requestId: 'r3' }), 'cancel')).resolves.toMatchObject({
      friendship: 'none',
    });
    expect(lastCall(fetchMock)).toMatchObject({ url: '/api/friends/requests/r3', method: 'DELETE' });

    await expect(runFriendAction(card({ friendship: 'friends' }), 'remove')).resolves.toMatchObject({ friendship: 'none' });
    expect(lastCall(fetchMock)).toMatchObject({ url: '/api/friends/u2', method: 'DELETE' });
  });
});

describe('useFriends', () => {
  it('loads the friends overview and the leaderboard', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      String(url).endsWith('/leaderboard')
        ? jsonResponse([{ user: card({ friendship: 'self' }), weekVolumeKg: 1200, monthWorkouts: 4, trophies: 3 }])
        : jsonResponse({ friends: [], incoming: [], outgoing: [] }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const friends = useFriends();
    await flushPromises();

    expect(friends.overview.value).toEqual({ friends: [], incoming: [], outgoing: [] });
    expect(friends.leaderboard.value).toHaveLength(1);
    expect(friends.error.value).toBeNull();
  });

  it('reports a load error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ statusCode: 500, message: 'boom' }, 500)));

    const friends = useFriends();
    await flushPromises();

    expect(friends.error.value).not.toBeNull();
    expect(friends.isLoading.value).toBe(false);
  });
});
