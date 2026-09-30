import { readonly, ref, watch, type DeepReadonly, type Ref } from 'vue';

import { useAuth } from '@/composables/useAuth';
import type { UserProfile } from '@/types/profile';

export interface ProfileStats {
  workouts: number;
  level: number;
  trophies: number;
  streakWeeks: number;
}

/*
 * Demo data until the profile endpoints exist: no API call is made, and a
 * save only lives in memory for the current session.
 */
const FAKE_PROFILE: UserProfile = {
  displayName: 'Alex Martin',
  username: 'alex.lifts',
  avatarUrl: null,
  bio: 'Push / pull / legs, four days a week. Chasing a 100 kg bench before summer.',
  location: 'Lille, France',
  memberSince: '2026-02-15',
  weightUnit: 'kg',
  weekStart: 'monday',
  bodyweightKg: 78,
  heightCm: 180,
};

const FAKE_STATS: ProfileStats = { workouts: 70, level: 13, trophies: 28, streakWeeks: 2 };

const SAVE_DELAY_MS = 400;

const profile = ref<UserProfile>({ ...FAKE_PROFILE });
const isSaving = ref(false);

watch(
  useAuth().user,
  (user) => {
    if (user) {
      profile.value = {
        ...profile.value,
        displayName: user.displayName,
        username: user.username,
        memberSince: user.createdAt.slice(0, 10),
      };
    }
  },
  { immediate: true },
);

export interface UseProfile {
  profile: DeepReadonly<Ref<UserProfile>>;
  stats: ProfileStats;
  isSaving: Ref<boolean>;
  save: (next: UserProfile) => Promise<void>;
}

export function useProfile(): UseProfile {
  return {
    profile: readonly(profile),
    stats: FAKE_STATS,
    isSaving,
    save: async (next) => {
      isSaving.value = true;
      await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
      profile.value = { ...next };
      isSaving.value = false;
    },
  };
}
