// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HevyConnectionState, HevySyncRun } from '@/types/hevy';
import { hevyConnected, syncRun } from '../../support/fake-api';
import { flushPromises, jsonResponse, stubFetch } from '../../support/mount';

type Handler = Parameters<typeof stubFetch>[0];

async function fresh(handler: Handler) {
  vi.resetModules();
  const fetchMock = stubFetch(handler);
  const { useHevyConnection } = await import('@/composables/useHevyConnection');
  const connection = useHevyConnection();
  await flushPromises();
  return { connection, fetchMock };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useHevyConnection', () => {
  it('loads the connection once and derives the indicator tone', async () => {
    const { connection, fetchMock } = await fresh(() => hevyConnected);
    const { useHevyConnection } = await import('@/composables/useHevyConnection');
    useHevyConnection();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(connection.state.value).toMatchObject({ connected: true, username: 'william_hevy' });
    expect(connection.indicatorTone.value).toBe('attention');
  });

  it.each([
    [{ connected: false }, 'disconnected'],
    [{ ...hevyConnected, drift: 0, lastSyncStatus: 'FAILED' }, 'attention'],
    [{ ...hevyConnected, drift: 0 }, 'connected'],
  ] as Array<[HevyConnectionState, string]>)('gives the tone %#', async (state, tone) => {
    const { connection } = await fresh(() => state);
    expect(connection.indicatorTone.value).toBe(tone);
  });

  it('reports a load error and stays unknown', async () => {
    const { connection } = await fresh(() => jsonResponse({ statusCode: 500, message: 'Down' }, 500));
    expect(connection.loadError.value).not.toBeNull();
    expect(connection.indicatorTone.value).toBe('unknown');
  });

  it('connects with a valid key', async () => {
    const { connection, fetchMock } = await fresh((_url, init) => (init?.method === 'POST' ? hevyConnected : { connected: false }));

    await expect(connection.connect('11111111-2222-3333-4444-555555555555')).resolves.toBe(true);

    expect(connection.state.value?.connected).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toEqual({ apiKey: '11111111-2222-3333-4444-555555555555' });
  });

  it.each([
    [401, 'rejected'],
    [402, 'not-pro'],
    [422, 'invalid-format'],
    [500, 'unknown'],
  ])('explains a refused key (%i)', async (status, kind) => {
    const { connection } = await fresh((_url, init) =>
      init?.method === 'POST' ? jsonResponse({ statusCode: status, message: 'Nope' }, status) : { connected: false },
    );

    await expect(connection.connect('key')).resolves.toBe(false);
    expect(connection.connectError.value?.kind).toBe(kind);
  });

  it('explains a network failure', async () => {
    let calls = 0;
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return jsonResponse({ connected: false });
        }
        throw new TypeError('Failed to fetch');
      }),
    );
    const { useHevyConnection } = await import('@/composables/useHevyConnection');
    const connection = useHevyConnection();
    await flushPromises();

    await connection.connect('key');
    expect(connection.connectError.value?.kind).toBe('network');
  });

  it('disconnects, and reports a failed disconnection', async () => {
    const responses: unknown[] = [{ connected: false }, jsonResponse({ statusCode: 500, message: 'Down' }, 500)];
    const { connection } = await fresh((_url, init) => (init?.method === 'DELETE' ? responses.shift() : hevyConnected));

    await expect(connection.disconnect()).resolves.toBe(true);
    expect(connection.state.value).toEqual({ connected: false });

    await expect(connection.disconnect()).resolves.toBe(false);
    expect(connection.disconnectError.value).not.toBeNull();
  });

  it('starts a sync and polls it until it finishes', async () => {
    const running = syncRun({ id: 'run9', status: 'RUNNING', finishedAt: null });
    const done: HevySyncRun = { ...running, status: 'SUCCESS', finishedAt: '2026-10-01T10:00:00.000Z' };
    const polls: unknown[] = [running, done];
    const { connection, fetchMock } = await fresh((url, init) => {
      if (init?.method === 'POST') return running;
      if (url.includes('/hevy/sync/runs/run9')) return polls.shift();
      return hevyConnected;
    });

    await connection.sync(true);
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe('/api/hevy/sync?full=true');
    expect(connection.activeRun.value?.status).toBe('RUNNING');

    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(connection.activeRun.value?.status).toBe('SUCCESS');
    const callsAfterDone = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/runs/run9'))).toHaveLength(2);
    expect(fetchMock.mock.calls).toHaveLength(callsAfterDone);
  });

  it('stops polling when the run cannot be read', async () => {
    const running = syncRun({ id: 'run9', status: 'RUNNING' });
    const { connection } = await fresh((url, init) => {
      if (init?.method === 'POST') return running;
      if (url.includes('/hevy/sync/runs/run9')) return jsonResponse({ statusCode: 500, message: 'Down' }, 500);
      return hevyConnected;
    });

    await connection.sync(false);
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(connection.syncError.value).not.toBeNull();
  });

  it('attaches to a sync that is already running', async () => {
    const running = syncRun({ id: 'run7', status: 'RUNNING' });
    const { connection } = await fresh((url, init) => {
      if (init?.method === 'POST') return jsonResponse({ statusCode: 409, message: 'Already running' }, 409);
      if (url.includes('/hevy/sync/runs?')) return { data: [running], meta: { page: 1, limit: 1, total: 1, totalPages: 1 } };
      return hevyConnected;
    });

    await connection.sync(false);

    expect(connection.activeRun.value?.id).toBe('run7');
  });

  it('explains a running sync it cannot find, and other sync errors', async () => {
    const posts: unknown[] = [
      jsonResponse({ statusCode: 409, message: 'Already running' }, 409),
      jsonResponse({ statusCode: 429, message: 'Slow down' }, 429),
    ];
    const { connection } = await fresh((url, init) => {
      if (init?.method === 'POST') return posts.shift();
      if (url.includes('/hevy/sync/runs?')) return { data: [], meta: { page: 1, limit: 1, total: 0, totalPages: 0 } };
      return hevyConnected;
    });

    await connection.sync(false);
    expect(connection.syncError.value).toBe('A sync is already running, but it could not be found. Try again in a moment.');

    await connection.sync(false);
    expect(connection.syncError.value).toBe('Slow down');
  });
});
