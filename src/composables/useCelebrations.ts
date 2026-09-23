import { computed, readonly, ref } from 'vue';

import { ApiError, apiGet, apiPost } from '@/lib/api';
import type { AchievementItem, UnseenAchievementsResponse } from '@/types/achievements';

/**
 * The unlock-celebration queue. Module-level on purpose: celebrations fire
 * after an import (Imports tab) as well as on load, so the queue and its modal
 * belong to the app shell, not to the Trophies page.
 */
const queue = ref<AchievementItem[]>([]);
/** True once the API has answered 404: the unseen endpoints do not exist yet. */
const unavailable = ref(false);
let loaded = false;
/** Codes that already failed to mark once — re-queued a single time, no loop. */
const retried = new Set<string>();

function enqueue(items: readonly AchievementItem[]): void {
  const known = new Set(queue.value.map((item) => item.code));
  const fresh = items.filter((item) => item.unlocked && !known.has(item.code));
  queue.value = [...queue.value, ...fresh];
}

/**
 * POST /achievements/:code/seen. The server is the source of truth for what
 * is unseen: a failed mark is harmless beyond this session, because the next
 * load offers the trophy again.
 */
async function markSeen(code: string): Promise<boolean> {
  if (unavailable.value) {
    return true;
  }
  try {
    await apiPost<unknown>(`/achievements/${encodeURIComponent(code)}/seen`, {});
    return true;
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 404) {
      unavailable.value = true;
      return true;
    }
    return false;
  }
}

export function useCelebrations() {
  /** Once per page load: a new session is when unseen unlocks are shown. */
  async function loadUnseen(): Promise<void> {
    if (loaded) {
      return;
    }
    loaded = true;
    try {
      enqueue(await apiGet<UnseenAchievementsResponse>('/achievements/unseen'));
    } catch (caught) {
      // A 404 means the endpoint is not built yet; anything else is not worth
      // interrupting the reader for — a celebration is never essential.
      if (caught instanceof ApiError && caught.status === 404) {
        unavailable.value = true;
      }
    }
  }

  /**
   * "Nice": optimistic. The trophy leaves the queue immediately and the next
   * one shows; the POST runs behind it. If it fails, the trophy goes back to
   * the END of the queue once, so the reader is never blocked on the network.
   */
  async function acknowledge(): Promise<void> {
    const current = queue.value[0];
    if (!current) {
      return;
    }
    queue.value = queue.value.slice(1);
    const ok = await markSeen(current.code);
    if (!ok && !retried.has(current.code)) {
      retried.add(current.code);
      queue.value = [...queue.value, current];
    }
  }

  /**
   * Escape or "Skip all": a reader with twelve queued trophies wants out, not
   * twelve Escape presses. Everything left is marked seen.
   */
  async function acknowledgeAll(): Promise<void> {
    const pending = queue.value;
    queue.value = [];
    await Promise.all(pending.map((item) => markSeen(item.code)));
  }

  return {
    queue: readonly(queue),
    current: computed(() => queue.value[0] ?? null),
    remaining: computed(() => queue.value.length),
    unavailable: readonly(unavailable),
    enqueue,
    loadUnseen,
    acknowledge,
    acknowledgeAll,
  };
}
