export type WeightUnit = 'kg' | 'lb';
export type WeekStart = 'monday' | 'sunday';
export type ThemePreference = 'system' | 'light' | 'dark';
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
  Pick<UserProfile, 'displayName' | 'username' | 'bio' | 'location' | 'weightUnit' | 'weekStart' | 'theme' | 'bodyweightKg' | 'heightCm' | 'recapFrequency' | 'recapWeekday' | 'recapMonthDay'>
>;
