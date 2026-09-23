import { computed, readonly, ref } from 'vue';

import { ApiError, apiGet, apiPost } from '@/lib/api';
import type { AchievementItem, UnseenAchievementsResponse } from '@/types/achievements';

const queue = ref<AchievementItem[]>([]);
const unavailable = ref(false);
let loaded = false;
const retried = new Set<string>();

function enqueue(items: readonly AchievementItem[]): void {
  const known = new Set(queue.value.map((item) => item.code));
  const fresh = items.filter((item) => item.unlocked && !known.has(item.code));
  queue.value = [...queue.value, ...fresh];
}

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
  async function loadUnseen(): Promise<void> {
    if (loaded) {
      return;
    }
    loaded = true;
    try {
      enqueue(await apiGet<UnseenAchievementsResponse>('/achievements/unseen'));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        unavailable.value = true;
      }
    }
  }

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
