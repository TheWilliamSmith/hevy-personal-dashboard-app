import type { ProfileStats } from '@/types/profile';

export type FriendshipState = 'self' | 'none' | 'outgoing' | 'incoming' | 'friends';

export interface UserCard {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  friendship: FriendshipState;
  requestId: string | null;
}

export interface UserTrophy {
  code: string;
  name: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xp: number;
  unlockedAt: string;
}

export interface UserWorkout {
  title: string;
  startedAt: string;
  durationSec: number;
  exerciseCount: number;
  totalVolumeKg: number;
}

export interface UserPage extends UserCard {
  isPrivate: boolean;
  bio: string | null;
  location: string | null;
  memberSince: string | null;
  stats: ProfileStats | null;
  recentTrophies: UserTrophy[] | null;
  recentWorkouts: UserWorkout[] | null;
}

export interface Friend {
  user: UserCard;
  since: string;
}

export interface FriendRequest {
  id: string;
  user: UserCard;
  createdAt: string;
}

export interface FriendsOverview {
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface LeaderboardEntry {
  user: UserCard;
  weekVolumeKg: number;
  monthWorkouts: number;
  trophies: number;
}
