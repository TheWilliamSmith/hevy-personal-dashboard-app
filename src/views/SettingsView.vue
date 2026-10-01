<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AccountSecurity from '@/components/profile/AccountSecurity.vue';
import ProfileForm from '@/components/profile/ProfileForm.vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useAuth } from '@/composables/useAuth';
import { useProfile } from '@/composables/useProfile';
import { useToasts } from '@/composables/useToasts';
import { ApiError } from '@/lib/api';
import type { UserProfile } from '@/types/profile';

const DataPanel = defineAsyncComponent(() => import('@/views/DataView.vue'));

type Section = 'profile' | 'account' | 'data';

const SECTIONS: ReadonlyArray<SegmentedOption<Section>> = [
  { value: 'profile', label: 'Profile' },
  { value: 'account', label: 'Account' },
  { value: 'data', label: 'Data' },
];

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

const section = computed<Section>(() =>
  route.query.section === 'data' || route.query.section === 'account' ? route.query.section : 'profile',
);

function setSection(next: Section): void {
  void router.replace({ name: 'home', query: { tab: 'settings', ...(next === 'profile' ? {} : { section: next }) } });
}

function messageOf(caught: unknown): string {
  return caught instanceof ApiError ? caught.message : 'Something went wrong. Try again.';
}

async function onSave(next: UserProfile): Promise<void> {
  usernameError.value = null;
  try {
    await profileState.save({
      displayName: next.displayName,
      username: next.username,
      bio: next.bio,
      location: next.location,
      weightUnit: next.weightUnit,
      weekStart: next.weekStart,
      bodyweightKg: next.bodyweightKg,
      heightCm: next.heightCm,
    });
    push({ tone: 'success', title: 'Profile saved' });
  } catch (caught) {
    const field = caught instanceof ApiError ? (caught.body as { field?: unknown } | null)?.field : null;
    if (field === 'username') {
      usernameError.value = messageOf(caught);
      return;
    }
    push({ tone: 'error', title: 'Could not save your profile', description: messageOf(caught) });
  }
}

async function onUpload(file: File): Promise<void> {
  try {
    await profileState.uploadAvatar(file);
    push({ tone: 'success', title: 'Profile picture updated' });
  } catch (caught) {
    push({ tone: 'error', title: 'Could not update the picture', description: messageOf(caught) });
  }
}

async function onRemoveAvatar(): Promise<void> {
  try {
    await profileState.removeAvatar();
    push({ tone: 'success', title: 'Profile picture removed' });
  } catch (caught) {
    push({ tone: 'error', title: 'Could not remove the picture', description: messageOf(caught) });
  }
}
</script>

<template>
  <div>
    <Teleport to="#topbar-actions" defer>
      <SegmentedControl :options="SECTIONS" :model-value="section" label="Settings section" @update:model-value="setSection" />
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

    <DataPanel v-else />
  </div>
</template>
