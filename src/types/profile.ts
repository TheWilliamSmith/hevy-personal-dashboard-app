import type { Locale } from '@/i18n';

export type WeightUnit = 'kg' | 'lb';
export type WeekStart = 'monday' | 'sunday';
export type ThemePreference = 'system' | 'light' | 'dark';
export type ProfileVisibility = 'public' | 'private';

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showBio: boolean;
  showStats: boolean;
  showTrophies: boolean;
  showWorkouts: boolean;
  showInLeaderboard: boolean;
}
export type RecapFrequency = 'off' | 'weekly' | 'monthly';

export interface UserProfile {
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  memberSince: string;
  weightUnit: WeightUnit;
  weekStart: WeekStart;
  theme: ThemePreference;
  locale: Locale;
  profileVisibility: ProfileVisibility;
  showBio: boolean;
  showStats: boolean;
  showTrophies: boolean;
  showWorkouts: boolean;
  showInLeaderboard: boolean;
  bodyweightKg: number | null;
  heightCm: number | null;
  recapFrequency: RecapFrequency;
  recapWeekday: number;
  recapMonthDay: number;
}

export interface ProfileStats {
  workouts: number;
  level: number;
  trophies: number;
  streakWeeks: number;
}

export interface ProfileResponse extends UserProfile {
  stats: ProfileStats;
}

export type ProfileChanges = Partial<
  Pick<UserProfile, 'displayName' | 'username' | 'bio' | 'location' | 'weightUnit' | 'weekStart' | 'theme' | 'locale' | keyof PrivacySettings | 'bodyweightKg' | 'heightCm' | 'recapFrequency' | 'recapWeekday' | 'recapMonthDay'>
>;
