<script setup lang="ts">
import { Eye, Globe, Lock } from 'lucide-vue-next';
import { computed, type DeepReadonly } from 'vue';
import { RouterLink } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { t } from '@/i18n';
import type { PrivacySettings, ProfileChanges, ProfileVisibility, UserProfile } from '@/types/profile';

const props = defineProps<{ profile: DeepReadonly<UserProfile>; isSaving: boolean }>();
const emit = defineEmits<{ change: [changes: ProfileChanges] }>();

type Block = Exclude<keyof PrivacySettings, 'profileVisibility'>;

const BLOCKS: readonly Block[] = ['showBio', 'showStats', 'showTrophies', 'showWorkouts', 'showInLeaderboard'];

const visibilities = computed<ReadonlyArray<SegmentedOption<ProfileVisibility>>>(() => [
  { value: 'public', label: t('privacy.public') },
  { value: 'private', label: t('privacy.private') },
]);

const isPrivate = computed(() => props.profile.profileVisibility === 'private');

function toggle(block: Block, event: Event): void {
  emit('change', { [block]: (event.target as HTMLInputElement).checked });
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <section class="flex max-w-3xl flex-col gap-5" :aria-busy="isSaving">
      <SectionHeader :title="t('privacy.pageTitle')" :subtitle="t('privacy.pageSubtitle')" />
      <SegmentedControl
        :model-value="profile.profileVisibility"
        :options="visibilities"
        :label="t('privacy.pageTitle')"
        class="self-start"
        @update:model-value="emit('change', { profileVisibility: $event })"
      />
      <p class="flex items-start gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
        <Lock v-if="isPrivate" class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <Globe v-else class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        {{ isPrivate ? t('privacy.privateHint') : t('privacy.publicHint') }}
      </p>
      <RouterLink
        :to="{ name: 'home', query: { tab: 'friends', user: profile.username, as: 'stranger' } }"
        class="inline-flex w-fit items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        <Eye class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('privacy.preview') }}
      </RouterLink>
    </section>

    <section class="flex max-w-3xl flex-col gap-4 border-t border-zinc-800 pt-8" :aria-busy="isSaving">
      <SectionHeader :title="t('privacy.blocksTitle')" :subtitle="t('privacy.blocksSubtitle')" />
      <ul class="flex flex-col divide-y divide-zinc-800">
        <li v-for="block in BLOCKS" :key="block">
          <label class="flex cursor-pointer items-start gap-3 py-3">
            <input
              type="checkbox"
              class="mt-0.5 h-4 w-4 accent-blue-600"
              :checked="profile[block]"
              :disabled="isSaving"
              @change="toggle(block, $event)"
            />
            <span class="flex flex-col">
              <span class="text-sm font-medium text-zinc-100">{{ t(`privacy.blocks.${block}.label`) }}</span>
              <span class="text-xs text-zinc-500">{{ t(`privacy.blocks.${block}.hint`) }}</span>
            </span>
          </label>
        </li>
      </ul>
      <p class="text-xs text-zinc-500">{{ t('privacy.friendsNote') }}</p>
    </section>
  </div>
</template>
