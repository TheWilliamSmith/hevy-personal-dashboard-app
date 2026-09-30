export type WeightUnit = 'kg' | 'lb';
export type WeekStart = 'monday' | 'sunday';

export interface UserProfile {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  memberSince: string;
  weightUnit: WeightUnit;
  weekStart: WeekStart;
  bodyweightKg: number | null;
  heightCm: number | null;
}
