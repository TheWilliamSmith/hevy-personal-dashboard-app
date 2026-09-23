import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AchievementItem } from '@/types/achievements';

async function freshQueue() {
  vi.resetModules();
  const { useCelebrations } = await import('./useCelebrations');
  return useCelebrations();
}

function trophy(code: string, unlocked = true): AchievementItem {
  return {
    code, family: 'VOLUME', tier: null, name: code, description: '', flavor: null, icon: 'dumbbell',
    rarity: 'RARE', xp: 100, secret: false, unlocked, unlockedAt: '2026-09-20T10:00:00.000Z',
    workoutId: null, progress: null,
  };
}

function stubFetch(status: number) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(String(url));
    return new Response('{}', { status, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('celebration queue', () => {
  it('enqueues unlocked trophies once, and ignores locked ones', async () => {
    const q = await freshQueue();
    q.enqueue([trophy('A'), trophy('B'), trophy('C', false)]);
    q.enqueue([trophy('A')]);
    expect(q.queue.value.map((item) => item.code)).toEqual(['A', 'B']);
  });

  it('advances before the server answers, then marks the trophy seen', async () => {
    const calls = stubFetch(200);
    const q = await freshQueue();
    q.enqueue([trophy('A'), trophy('B')]);
    const pending = q.acknowledge();
    expect(q.current.value?.code).toBe('B');
    await pending;
    expect(calls.some((url) => url.endsWith('/achievements/A/seen'))).toBe(true);
  });

  it('puts a trophy back at the end once when marking fails, never in a loop', async () => {
    stubFetch(500);
    const q = await freshQueue();
    q.enqueue([trophy('A'), trophy('B')]);
    await q.acknowledge();
    expect(q.queue.value.map((item) => item.code)).toEqual(['B', 'A']);
    await q.acknowledge();
    await q.acknowledge();
    expect(q.queue.value.map((item) => item.code)).toEqual(['B']);
  });

  it('treats a 404 as "not built yet": nothing is re-queued', async () => {
    stubFetch(404);
    const q = await freshQueue();
    q.enqueue([trophy('A')]);
    await q.acknowledge();
    expect(q.queue.value).toEqual([]);
    expect(q.unavailable.value).toBe(true);
  });

  it('skip-all clears the queue in one go', async () => {
    stubFetch(200);
    const q = await freshQueue();
    q.enqueue([trophy('A'), trophy('B'), trophy('C')]);
    await q.acknowledgeAll();
    expect(q.remaining.value).toBe(0);
  });
});
