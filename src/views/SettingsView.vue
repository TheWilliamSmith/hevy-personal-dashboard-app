<script setup lang="ts">
import { t } from '@/i18n';
import { computed, defineAsyncComponent, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AccountSecurity from '@/components/profile/AccountSecurity.vue';
import PreferencesPanel from '@/components/profile/PreferencesPanel.vue';
import ProfileForm from '@/components/profile/ProfileForm.vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useAuth } from '@/composables/useAuth';
import { useProfile } from '@/composables/useProfile';
import { useToasts } from '@/composables/useToasts';
import { ApiError } from '@/lib/api';
import type { ProfileChanges, UserProfile } from '@/types/profile';

const DataPanel = defineAsyncComponent(() => import('@/views/DataView.vue'));

type Section = 'profile' | 'account' | 'preferences' | 'data';

const SECTION_VALUES: readonly Section[] = ['profile', 'account', 'preferences', 'data'];

const sections = computed<ReadonlyArray<SegmentedOption<Section>>>(() => [
  { value: 'profile', label: t('settings.profile') },
  { value: 'account', label: t('settings.account') },
  { value: 'preferences', label: t('settings.preferences'), shortLabel: t('settings.preferencesShort') },
  { value: 'data', label: t('settings.data') },
]);

const route = useRoute();
const router = useRouter();
const profileState = useProfile();
const { profile, stats, isSaving } = profileState;
const usernameError = ref<string | null>(null);
const auth = useAuth();
const { push } = useToasts();

function signOut(): void {
  auth.signOut();
  window.location.assign(router.resolve({ name: 'sign-in' }).href);
}

const section = computed<Section>(() => SECTION_VALUES.find((value) => value === route.query.section) ?? 'profile');

function setSection(next: Section): void {
  void router.replace({ name: 'home', query: { tab: 'settings', ...(next === 'profile' ? {} : { section: next }) } });
}

function messageOf(error_: unknown): string {
  return error_ instanceof ApiError ? error_.message : t('common.somethingWrong');
}

async function onSave(next: UserProfile): Promise<void> {
  usernameError.value = null;
  try {
    await profileState.save({
      displayName: next.displayName,
      username: next.username,
      bio: next.bio,
      location: next.location,
      bodyweightKg: next.bodyweightKg,
      heightCm: next.heightCm,
    });
    push({ tone: 'success', title: t('settings.profileSaved') });
  } catch (error_) {
    const field = error_ instanceof ApiError ? (error_.body as { field?: unknown } | null)?.field : null;
    if (field === 'username') {
      usernameError.value = messageOf(error_);
      return;
    }
    push({ tone: 'error', title: t('settings.saveFailed'), description: messageOf(error_) });
  }
}

async function onPreferences(changes: ProfileChanges): Promise<void> {
  try {
    await profileState.save(changes);
    push({ tone: 'success', title: t('preferences.saved') });
  } catch (error_) {
    push({ tone: 'error', title: t('preferences.saveFailed'), description: messageOf(error_) });
  }
}

async function onUpload(file: File): Promise<void> {
  try {
    await profileState.uploadAvatar(file);
    push({ tone: 'success', title: t('settings.pictureUpdated') });
  } catch (error_) {
    push({ tone: 'error', title: t('settings.pictureUpdateFailed'), description: messageOf(error_) });
  }
}

async function onRemoveAvatar(): Promise<void> {
  try {
    await profileState.removeAvatar();
    push({ tone: 'success', title: t('settings.pictureRemoved') });
  } catch (error_) {
    push({ tone: 'error', title: t('settings.pictureRemoveFailed'), description: messageOf(error_) });
  }
}
</script>

<template>
  <div>
    <Teleport to="#topbar-actions" defer>
      <SegmentedControl :options="sections" :model-value="section" :label="t('settings.section')" @update:model-value="setSection" />
    </Teleport>

    <div v-if="section === 'profile'" class="px-4 pb-10 sm:px-6">
      <div class="flex flex-col gap-10 pt-6">
        <SectionError v-if="profileState.error.value" :message="profileState.error.value" @retry="profileState.load" />
        <template v-if="profile">
          <ProfileHeader
            :profile="profile"
            :stats="stats"
            :is-saving="isSaving"
            @upload="onUpload"
            @remove="onRemoveAvatar"
          />
          <ProfileForm
            :key="profileState.hasLoaded.value ? 'loaded' : 'pending'"
            :profile="profile"
            :is-saving="isSaving || !profileState.hasLoaded.value"
            :username-error="usernameError"
            @save="onSave"
          />
        </template>
      </div>
    </div>

    <div v-else-if="section === 'account'" class="px-4 pt-6 pb-10 sm:px-6">
      <AccountSecurity @sign-out="signOut" />
    </div>

    <div v-else-if="section === 'preferences'" class="px-4 pt-6 pb-10 sm:px-6">
      <PreferencesPanel v-if="profile" :profile="profile" :is-saving="isSaving" @change="onPreferences" />
    </div>

    <DataPanel v-else />
  </div>
</template>
