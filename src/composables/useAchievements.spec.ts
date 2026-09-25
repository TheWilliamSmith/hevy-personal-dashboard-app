import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse, withRouter } from '@/test/router-harness';
import type { AchievementItem } from '@/types/achievements';

import { useAchievements } from './useAchievements';

afterEach(() => vi.unstubAllGlobals());

function item(overrides: Partial<AchievementItem> = {}): AchievementItem {
  return {
    code: 'VOLUME_1',
    family: 'VOLUME',
    tier: null,
    name: 'First ton',
    description: '',
    flavor: null,
    icon: 'dumbbell',
    rarity: 'COMMON',
    xp: 50,
    secret: false,
    unlocked: true,
    unlockedAt: '2026-09-01T10:00:00.000Z',
    workoutId: null,
    progress: null,
    ...overrides,
  };
}

const catalog = {
  level: { level: 3, totalXp: 500, into: 50, needed: 200 },
  unlockedCount: 2,
  totalCount: 5,
  groups: [
    {
      family: 'VOLUME',
      total: 3,
      unlocked: 2,
      achievements: [
        item({ code: 'VOLUME_1', rarity: 'COMMON', unlockedAt: '2026-09-01T10:00:00.000Z' }),
        item({ code: 'VOLUME_2', rarity: 'EPIC', unlockedAt: '2026-09-10T10:00:00.000Z' }),
        item({ code: 'VOLUME_3', unlocked: false, progress: { value: 5, target: 10 } }),
      ],
    },
    {
      family: 'STRENGTH',
      total: 2,
      unlocked: 0,
      achievements: [item({ code: 'STRENGTH_1', family: 'STRENGTH', unlocked: false })],
    },
  ],
};

function stubCatalog() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/achievements/unseen')) return jsonResponse([]);
      return jsonResponse(catalog);
    }),
  );
}

describe('useAchievements', () => {
  it('loads the catalog and derives level/counts', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useAchievements());
    await flushPromises();

    expect(result.level.value).toEqual(catalog.level);
    expect(result.unlockedCount.value).toBe(2);
    expect(result.totalCount.value).toBe(5);
    expect(result.rarityCounts.value.COMMON).toBe(1);
    expect(result.rarityCounts.value.EPIC).toBe(1);
  });

  it('picks the highest-rarity, most-recent unlock as the highlight', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useAchievements());
    await flushPromises();

    expect(result.highlight.value?.code).toBe('VOLUME_2');
  });

  it('defaults to showing all families and all statuses', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useAchievements());
    await flushPromises();

    expect(result.family.value).toBeNull();
    expect(result.show.value).toBe('all');
    expect(result.sections.value).toHaveLength(2);
  });

  it('filters sections by family and by show status from the query', async () => {
    stubCatalog();
    const { result } = await withRouter({ family: 'VOLUME', show: 'unlocked' }, () => useAchievements());
    await flushPromises();

    expect(result.family.value).toBe('VOLUME');
    expect(result.show.value).toBe('unlocked');
    expect(result.sections.value).toHaveLength(1);
    expect(result.sections.value[0]?.items.every((entry) => entry.unlocked)).toBe(true);
  });

  it('filters to locked and to in-progress items', async () => {
    stubCatalog();
    const { result: locked } = await withRouter({ show: 'locked' }, () => useAchievements());
    await flushPromises();
    expect(locked.sections.value.flatMap((s) => s.items).every((entry) => !entry.unlocked)).toBe(true);

    const { result: progress } = await withRouter({ show: 'progress' }, () => useAchievements());
    await flushPromises();
    expect(progress.sections.value.flatMap((s) => s.items).map((entry) => entry.code)).toEqual(['VOLUME_3']);
  });

  it('ignores an invalid family or show value in the query', async () => {
    stubCatalog();
    const { result } = await withRouter({ family: 'nope', show: 'nope' }, () => useAchievements());
    await flushPromises();
    expect(result.family.value).toBeNull();
    expect(result.show.value).toBe('all');
  });

  it('counts the visible items across sections', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useAchievements());
    await flushPromises();
    expect(result.visibleCount.value).toBe(4);
  });

  it('pushes the family and show filters to the query', async () => {
    stubCatalog();
    const { result, router } = await withRouter({}, () => useAchievements());
    await flushPromises();

    result.setFamily('VOLUME');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ tab: 'trophies', family: 'VOLUME' });

    result.setShow('unlocked');
    await flushPromises();
    expect(router.currentRoute.value.query.show).toBe('unlocked');

    result.setShow('all');
    await flushPromises();
    expect(router.currentRoute.value.query.show).toBeUndefined();

    result.setFamily(null);
    await flushPromises();
    expect(router.currentRoute.value.query.family).toBeUndefined();
  });

  it('surfaces an error message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'bad' }, 400)));
    const { result } = await withRouter({}, () => useAchievements());
    await flushPromises();
    expect(result.error.value).toBe('bad');
    expect(result.level.value).toBeNull();
  });

  it('re-fetches when refresh is called', async () => {
    stubCatalog();
    const { result } = await withRouter({}, () => useAchievements());
    await flushPromises();
    result.refresh();
    await flushPromises();
    expect(result.isLoading.value).toBe(false);
  });
});
