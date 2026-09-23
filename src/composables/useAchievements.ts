import { computed, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';

import { ApiError, apiGet } from '@/lib/api';
import { dataVersion } from '@/lib/data-version';
import { FAMILY_ORDER, RARITY_ORDER } from '@/constants/achievements';
import type {
  AchievementCatalog,
  AchievementFamily,
  AchievementItem,
  Level,
  Rarity,
} from '@/types/achievements';
import {
  familyRank,
  isInProgress,
  isMasked,
  isNegative,
  ladderSizes,
  orderWithLadders,
} from '@/utils/achievements';

import { useCelebrations } from './useCelebrations';

export type TrophyShow = 'all' | 'unlocked' | 'locked' | 'progress';

const SHOWS: readonly TrophyShow[] = ['all', 'unlocked', 'locked', 'progress'];

function queryString(query: LocationQuery, key: string): string {
  const value = query[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return typeof value === 'string' ? value : '';
}

export interface FamilySection {
  family: AchievementFamily;
  total: number;
  unlocked: number;
  items: AchievementItem[];
}

export interface UseAchievements {
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  level: ComputedRef<Level | null>;
  unlockedCount: ComputedRef<number>;
  totalCount: ComputedRef<number>;
  /** Unlocked, non-negative trophies per rarity. */
  rarityCounts: ComputedRef<Record<Rarity, number>>;
  /** The rarest trophy earned; ties go to the most recent. */
  highlight: ComputedRef<AchievementItem | null>;
  family: ComputedRef<AchievementFamily | null>;
  show: ComputedRef<TrophyShow>;
  sections: ComputedRef<FamilySection[]>;
  ladders: ComputedRef<Map<string, number>>;
  visibleCount: ComputedRef<number>;
  setFamily: (family: AchievementFamily | null) => void;
  setShow: (show: TrophyShow) => void;
  refresh: () => void;
}

/**
 * The trophy room: catalog, URL-synced filters, and the hero's derived stats.
 * The unseen queue is shared with the app shell via useCelebrations.
 */
export function useAchievements(): UseAchievements {
  const route = useRoute();
  const router = useRouter();

  const catalog = ref<AchievementCatalog | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let controller: AbortController | null = null;

  async function fetchCatalog(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    isLoading.value = true;
    error.value = null;
    try {
      const result = await apiGet<AchievementCatalog>('/achievements', {}, signal);
      if (!signal.aborted) catalog.value = result;
    } catch (caught) {
      if (!signal.aborted) {
        error.value = caught instanceof ApiError ? caught.message : 'Something went wrong.';
      }
    } finally {
      if (!signal.aborted) isLoading.value = false;
    }
  }

  watch(dataVersion, () => void fetchCatalog(), { immediate: true });
  onScopeDispose(() => controller?.abort());

  // Checked here too, not only in the shell, so opening this tab directly
  // after an import still surfaces anything the import unlocked.
  void useCelebrations().loadUnseen();

  const family = computed<AchievementFamily | null>(() => {
    const value = queryString(route.query, 'family');
    return (FAMILY_ORDER as readonly string[]).includes(value) ? (value as AchievementFamily) : null;
  });

  const show = computed<TrophyShow>(() => {
    const value = queryString(route.query, 'show');
    return (SHOWS as readonly string[]).includes(value) ? (value as TrophyShow) : 'all';
  });

  function push(next: Record<string, string | undefined>): void {
    const query: Record<string, string> = { tab: 'trophies' };
    for (const [key, value] of Object.entries({ ...route.query, ...next })) {
      if (typeof value === 'string' && value !== '' && key !== 'tab') query[key] = value;
    }
    void router.replace({ name: 'home', query });
  }

  const allItems = computed(() => catalog.value?.groups.flatMap((group) => group.achievements) ?? []);

  const rarityCounts = computed(() => {
    const counts: Record<Rarity, number> = { COMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 };
    for (const item of allItems.value) {
      if (item.unlocked && !isNegative(item)) counts[item.rarity] += 1;
    }
    return counts;
  });

  const highlight = computed(() => {
    const earned = allItems.value.filter((item) => item.unlocked && !isNegative(item));
    return earned.reduce<AchievementItem | null>((best, item) => {
      if (!best) return item;
      const byRarity = RARITY_ORDER.indexOf(item.rarity) - RARITY_ORDER.indexOf(best.rarity);
      if (byRarity !== 0) return byRarity > 0 ? item : best;
      return (item.unlockedAt ?? '') > (best.unlockedAt ?? '') ? item : best;
    }, null);
  });

  /**
   * A masked secret is neither "unlocked" nor "in progress", and it has no
   * progress to show, so it only appears under All and Locked.
   */
  function matches(item: AchievementItem): boolean {
    switch (show.value) {
      case 'unlocked':
        return item.unlocked;
      case 'locked':
        return !item.unlocked;
      case 'progress':
        return !isMasked(item) && isInProgress(item);
      default:
        return true;
    }
  }

  const sections = computed<FamilySection[]>(() =>
    (catalog.value?.groups ?? [])
      .filter((group) => family.value === null || group.family === family.value)
      .sort((a, b) => familyRank(a.family) - familyRank(b.family))
      .map((group) => ({
        family: group.family,
        total: group.total,
        unlocked: group.unlocked,
        items: orderWithLadders(group.achievements.filter(matches)),
      }))
      .filter((section) => section.items.length > 0),
  );

  return {
    isLoading,
    error,
    level: computed(() => catalog.value?.level ?? null),
    unlockedCount: computed(() => catalog.value?.unlockedCount ?? 0),
    totalCount: computed(() => catalog.value?.totalCount ?? 0),
    rarityCounts,
    highlight,
    family,
    show,
    sections,
    // Pip counts come from the full catalog, so a filter never shortens a ladder.
    ladders: computed(() => ladderSizes(allItems.value)),
    visibleCount: computed(() => sections.value.reduce((sum, section) => sum + section.items.length, 0)),
    setFamily: (next) => push({ family: next ?? undefined }),
    setShow: (next) => push({ show: next === 'all' ? undefined : next }),
    refresh: () => void fetchCatalog(),
  };
}
