import { ref, type Ref } from 'vue';

import { t } from '@/i18n';
import { ApiError, apiDelete, apiGet, apiPost } from '@/lib/api';
import type { FriendsOverview, LeaderboardEntry, UserCard } from '@/types/friends';

export type FriendAction = 'add' | 'cancel' | 'accept' | 'decline' | 'remove';

export function availableActions(user: Pick<UserCard, 'friendship'>): FriendAction[] {
  switch (user.friendship) {
    case 'none':
      return ['add'];
    case 'outgoing':
      return ['cancel'];
    case 'incoming':
      return ['accept', 'decline'];
    case 'friends':
      return ['remove'];
    case 'self':
      return [];
  }
}

export async function runFriendAction(user: UserCard, action: FriendAction): Promise<UserCard> {
  switch (action) {
    case 'add':
      return apiPost<UserCard>('/friends/requests', { username: user.username });
    case 'accept':
      return apiPost<UserCard>(`/friends/requests/${user.requestId}/accept`, {});
    case 'cancel':
      await apiDelete(`/friends/requests/${user.requestId}`);
      return { ...user, friendship: 'none', requestId: null };
    case 'decline':
      await apiPost(`/friends/requests/${user.requestId}/decline`, {});
      return { ...user, friendship: 'none', requestId: null };
    case 'remove':
      await apiDelete(`/friends/${user.id}`);
      return { ...user, friendship: 'none', requestId: null };
  }
}

export interface UseFriends {
  overview: Ref<FriendsOverview | null>;
  leaderboard: Ref<LeaderboardEntry[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  load: () => Promise<void>;
}

export function useFriends(): UseFriends {
  const overview = ref<FriendsOverview | null>(null);
  const leaderboard = ref<LeaderboardEntry[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const [nextOverview, nextLeaderboard] = await Promise.all([
        apiGet<FriendsOverview>('/friends'),
        apiGet<LeaderboardEntry[]>('/friends/leaderboard'),
      ]);
      overview.value = nextOverview;
      leaderboard.value = nextLeaderboard;
    } catch (caught) {
      error.value = caught instanceof ApiError ? caught.message : t('errors.generic');
    } finally {
      isLoading.value = false;
    }
  }

  void load();

  return { overview, leaderboard, isLoading, error, load };
}
