export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type AchievementFamily =
  | 'VOLUME'
  | 'CONSISTENCY'
  | 'STRENGTH'
  | 'ENDURANCE'
  | 'VARIETY'
  | 'MILESTONE'
  | 'CARDIO'
  | 'ODDITY';

export interface AchievementProgress {
  value: number;
  target: number;
}

export interface AchievementItem {
  code: string;
  family: AchievementFamily;
  tier: number | null;
  name: string;
  description: string;
  flavor: string | null;
  icon: string;
  rarity: Rarity;
  xp: number;
  secret: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  workoutId: string | null;
  progress: AchievementProgress | null;
}

export interface AchievementFamilyGroup {
  family: AchievementFamily;
  total: number;
  unlocked: number;
  achievements: AchievementItem[];
}

export interface Level {
  level: number;
  totalXp: number;
  into: number;
  needed: number;
}

export interface AchievementCatalog {
  level: Level;
  unlockedCount: number;
  totalCount: number;
  groups: AchievementFamilyGroup[];
}

export interface RecentUnlock {
  code: string;
  name: string;
  icon: string;
  rarity: Rarity;
  xp: number;
  unlockedAt: string;
}

export interface AchievementsSummary {
  level: Level;
  unlockedCount: number;
  totalCount: number;
  recentUnlocks: RecentUnlock[];
}

export type UnseenAchievementsResponse = AchievementItem[];
