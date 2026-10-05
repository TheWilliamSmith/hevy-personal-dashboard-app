import { getCurrentScope, onScopeDispose, readonly, ref, watch, type Ref } from 'vue';

import { useAuth } from '@/composables/useAuth';
import { apiGet } from '@/lib/api';

export const FRIEND_REQUESTS_POLL_MS = 60_000;

const incoming = ref(0);
const auth = useAuth();
let consumers = 0;
let timer: ReturnType<typeof setInterval> | null = null;

export async function refreshFriendRequests(): Promise<void> {
  if (!auth.user.value) {
    incoming.value = 0;
    return;
  }
  try {
    incoming.value = (await apiGet<{ incoming?: number }>('/friends/requests/count')).incoming ?? 0;
  } catch {
    return;
  }
}

export function setFriendRequests(count: number): void {
  incoming.value = count;
}

function onVisible(): void {
  if (document.visibilityState === 'visible') {
    void refreshFriendRequests();
  }
}

function start(): void {
  timer = setInterval(() => void refreshFriendRequests(), FRIEND_REQUESTS_POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
  void refreshFriendRequests();
}

function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  document.removeEventListener('visibilitychange', onVisible);
}

watch(
  () => auth.user.value?.id ?? null,
  () => void refreshFriendRequests(),
);

export function useFriendRequests(): { incoming: Readonly<Ref<number>> } {
  if (getCurrentScope()) {
    consumers += 1;
    if (consumers === 1) {
      start();
    }
    onScopeDispose(() => {
      consumers -= 1;
      if (consumers === 0) {
        stop();
      }
    });
  }
  return { incoming: readonly(incoming) };
}
