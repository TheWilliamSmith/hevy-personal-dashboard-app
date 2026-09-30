<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import ProfileForm from '@/components/profile/ProfileForm.vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useAuth } from '@/composables/useAuth';
import { useProfile } from '@/composables/useProfile';
import { useToasts } from '@/composables/useToasts';
import type { UserProfile } from '@/types/profile';

const DataPanel = defineAsyncComponent(() => import('@/views/DataView.vue'));

type Section = 'profile' | 'data';

const SECTIONS: ReadonlyArray<SegmentedOption<Section>> = [
  { value: 'profile', label: 'Profile' },
  { value: 'data', label: 'Data' },
];

const route = useRoute();
const router = useRouter();
const { profile, stats, isSaving, save } = useProfile();
const auth = useAuth();
const { push } = useToasts();

function signOut(): void {
  auth.signOut();
  void router.replace({ name: 'sign-in' });
}

const section = computed<Section>(() => (route.query.section === 'data' ? 'data' : 'profile'));

function setSection(next: Section): void {
  void router.replace({ name: 'home', query: { tab: 'settings', ...(next === 'data' ? { section: 'data' } : {}) } });
}

const secondary =
  'rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';

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

        <section class="flex flex-col gap-4">
          <SectionHeader title="Account" subtitle="Sign-in and security" />
          <div class="flex flex-wrap gap-2">
            <RouterLink :to="{ name: 'forgot-password' }" :class="[secondary, 'text-zinc-100']">Change password</RouterLink>
            <button type="button" :class="[secondary, 'text-red-400 hover:text-red-300']" @click="signOut">Sign out</button>
          </div>
        </section>
      </div>
    </div>

    <DataPanel v-else />
  </div>
</template>
