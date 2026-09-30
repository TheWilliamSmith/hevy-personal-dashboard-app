<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AccountSecurity from '@/components/profile/AccountSecurity.vue';
import ProfileForm from '@/components/profile/ProfileForm.vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useAuth } from '@/composables/useAuth';
import { useProfile } from '@/composables/useProfile';
import { useToasts } from '@/composables/useToasts';
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
const { profile, stats, isSaving, save } = useProfile();
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

async function onSave(next: UserProfile): Promise<void> {
  await save(next);
  push({ tone: 'success', title: 'Profile saved', description: 'Demo mode: changes last until you reload the page.' });
}
</script>

<template>
  <div>
    <Teleport to="#topbar-actions" defer>
      <SegmentedControl :options="SECTIONS" :model-value="section" label="Settings section" @update:model-value="setSection" />
    </Teleport>

    <div v-if="section === 'profile'" class="px-4 pb-10 sm:px-6">
      <div class="flex flex-col gap-10 pt-6">
        <ProfileHeader :profile="profile" :stats="stats" />
        <ProfileForm :profile="profile" :is-saving="isSaving" @save="onSave" />
      </div>
    </div>

    <div v-else-if="section === 'account'" class="px-4 pt-6 pb-10 sm:px-6">
      <AccountSecurity @sign-out="signOut" />
    </div>

    <DataPanel v-else />
  </div>
</template>
