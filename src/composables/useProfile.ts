import { t } from '@/i18n';
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';

import { useAuth } from '@/composables/useAuth';
import { ApiError, apiDelete, apiGet, apiPatch, apiUpload, apiUrl } from '@/lib/api';
import type { ProfileChanges, ProfileResponse, ProfileStats, UserProfile } from '@/types/profile';
import { applyPreferences, applyTheme, theme } from '@/utils/preferences';

const loaded = ref<ProfileResponse | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
let loadedFor: string | null = null;

const auth = useAuth();

function accept(response: ProfileResponse): void {
  loaded.value = response;
  applyPreferences({ weightUnit: response.weightUnit, weekStart: response.weekStart });
  applyTheme(response.theme);
  auth.updateUser({ displayName: response.displayName, username: response.username });
}

async function load(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    accept(await apiGet<ProfileResponse>('/me/profile'));
  } catch (error_) {
    error.value = error_ instanceof ApiError ? error_.message : t('errors.loadProfile');
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => auth.user.value?.id ?? null,
  (userId) => {
    if (userId === null) {
      loaded.value = null;
      loadedFor = null;
      return;
    }
    if (userId !== loadedFor) {
      loadedFor = userId;
      void load();
    }
  },
  { immediate: true },
);

async function saving<T>(work: () => Promise<T>): Promise<T> {
  isSaving.value = true;
  try {
    return await work();
  } finally {
    isSaving.value = false;
  }
}

const profile = computed<UserProfile | null>(() => {
  const response = loaded.value;
  if (response) {
    const { stats: _stats, ...fields } = response;
    return { ...fields, avatarUrl: fields.avatarUrl ? apiUrl(fields.avatarUrl) : null };
  }
  const user = auth.user.value;
  return user
    ? {
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        avatarUrl: null,
        bio: '',
        location: '',
        memberSince: user.createdAt,
        weightUnit: 'kg',
        weekStart: 'monday',
        theme: theme.value,
        bodyweightKg: null,
        heightCm: null,
        recapFrequency: 'weekly',
        recapWeekday: 1,
        recapMonthDay: 1,
      }
    : null;
});

export interface UseProfile {
  profile: ComputedRef<UserProfile | null>;
  stats: ComputedRef<ProfileStats | null>;
  hasLoaded: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
  isSaving: Ref<boolean>;
  error: Ref<string | null>;
  load: () => Promise<void>;
  save: (changes: ProfileChanges) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

export function useProfile(): UseProfile {
  return {
    profile,
    stats: computed(() => loaded.value?.stats ?? null),
    hasLoaded: computed(() => loaded.value !== null),
    isLoading,
    isSaving,
    error,
    load,
    save: (changes) => saving(async () => accept(await apiPatch<ProfileResponse>('/me/profile', changes))),
    uploadAvatar: (file) =>
      saving(async () => {
        const form = new FormData();
        form.append('file', file);
        accept(await apiUpload<ProfileResponse>('/me/avatar', form));
      }),
    removeAvatar: () => saving(async () => accept(await apiDelete<ProfileResponse>('/me/avatar'))),
  };
}
