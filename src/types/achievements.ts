/**
 * Mirrors api/src/achievements/dto/achievement-response.dto.ts and the unions
 * in achievements.catalog.ts, verified against the running API.
 *
 * The unseen queue and the import's `newAchievements` are NOT in the API yet:
 * see UnseenAchievementsResponse below.
 */

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

/**
 * `value` and `target` are in the rule's raw unit — kg for volume, seconds for
 * time, km for cardio, weeks for streaks. The DTO carries no unit; see
 * formatProgress for how the client names it.
 */
export interface AchievementProgress {
  value: number;
  target: number;
}

export interface AchievementItem {
  code: string;
  family: AchievementFamily;
  /** Position in a tiered ladder (VOLUME_1T is 1 of 9); null when not tiered. */
  tier: number | null;
  /** "???" while a secret achievement is locked. */
  name: string;
  /** Masked while a secret achievement is locked. */
  description: string;
  flavor: string | null;
  /** A Lucide icon name, e.g. "dumbbell"; "lock" when masked. */
  icon: string;
  rarity: Rarity;
  /** 0 marks a negative achievement (a nudge, e.g. Leg Day Denier). */
  xp: number;
  secret: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  workoutId: string | null;
  /** Null for event rules with no meaningful "how close". */
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
  /** XP earned within the current level. */
  into: number;
  /** XP the current level spans: the bar is into / needed. */
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

/** GET /achievements/summary — the dashboard card. */
export interface AchievementsSummary {
  level: Level;
  unlockedCount: number;
  totalCount: number;
  /** Newest first, 3 of them. */
  recentUnlocks: RecentUnlock[];
}

/**
 * GET /achievements/unseen — specified, not implemented in the API yet (there
 * is no seen column on UnlockedAchievement). Shaped as a bare list of the
 * catalog's item DTO, the natural fit. Until it exists the queue stays empty.
 */
export type UnseenAchievementsResponse = AchievementItem[];
