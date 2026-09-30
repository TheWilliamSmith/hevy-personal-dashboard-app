<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ProfileForm from '@/components/profile/ProfileForm.vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
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
const { push } = useToasts();

const section = computed<Section>(() => (route.query.section === 'data' ? 'data' : 'profile'));

function setSection(next: Section): void {
  void router.replace({ name: 'home', query: { tab: 'settings', ...(next === 'data' ? { section: 'data' } : {}) } });
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

    <DataPanel v-else />
  </div>
</template>
