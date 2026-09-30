<script setup lang="ts">
import { computed, ref } from 'vue';

import FamilyFilter from '@/components/achievements/FamilyFilter.vue';
import LadderDialog from '@/components/achievements/LadderDialog.vue';
import LevelOverview from '@/components/achievements/LevelOverview.vue';
import SecretTrophyTile from '@/components/achievements/SecretTrophyTile.vue';
import SeriesTile from '@/components/achievements/SeriesTile.vue';
import TrophyCard from '@/components/achievements/TrophyCard.vue';
import UnlockedSpotlight from '@/components/achievements/UnlockedSpotlight.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useAchievements, type TrophyShow } from '@/composables/useAchievements';
import { FAMILY_LABELS } from '@/constants/achievements';
import type { AchievementFamily, AchievementItem } from '@/types/achievements';
import { isMasked, layoutSection } from '@/utils/achievements';

const trophies = useAchievements();

const layouts = computed(() =>
  trophies.sections.value.map((section) => ({
    family: section.family,
    unlocked: section.unlocked,
    total: section.total,
    ...layoutSection(section.items, trophies.ladders.value),
  })),
);

const openLadder = ref<{ key: string; family: AchievementFamily; tiers: AchievementItem[] } | null>(null);

const SHOWS: ReadonlyArray<SegmentedOption<TrophyShow>> = [
  { value: 'all', label: 'Everything', shortLabel: 'All' },
  { value: 'unlocked', label: 'Unlocked', shortLabel: 'Done' },
  { value: 'locked', label: 'Locked' },
  { value: 'progress', label: 'In progress', shortLabel: 'Active' },
];

const EMPTY: Record<TrophyShow, string> = {
  unlocked: 'Nothing unlocked here yet — the first one is the hardest.',
  locked: 'Everything in this family is unlocked. Impressive.',
  progress: 'Nothing started here yet.',
  all: 'No achievements to show.',
};
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <Teleport to="#topbar-actions" defer>
      <SegmentedControl
        :options="SHOWS"
        :model-value="trophies.show.value"
        label="Show trophies"
        @update:model-value="trophies.setShow"
      />
    </Teleport>

    <div class="flex flex-col gap-10 pt-6">
      <SectionError v-if="trophies.error.value" :message="trophies.error.value" @retry="trophies.refresh" />

      <template v-else>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
          <LevelOverview
            class="lg:pr-8"
            :level="trophies.level.value"
            :rarity-counts="trophies.rarityCounts.value"
            :is-loading="trophies.isLoading.value"
          />
          <UnlockedSpotlight
            class="border-zinc-800 lg:border-l lg:pl-8"
            :unlocked-count="trophies.unlockedCount.value"
            :total-count="trophies.totalCount.value"
            :highlight="trophies.highlight.value"
            :is-loading="trophies.isLoading.value"
          />
        </div>

        <FamilyFilter
          :families="trophies.families.value"
          :active="trophies.family.value"
          @select="trophies.setFamily"
        />

        <div
          v-if="trophies.isLoading.value && trophies.totalCount.value === 0"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"
          aria-busy="true"
        >
          <div v-for="card in 12" :key="card" class="h-44 animate-pulse rounded-lg bg-zinc-900" />
        </div>

        <EmptyState v-else-if="trophies.visibleCount.value === 0" :message="EMPTY[trophies.show.value]" />

        <section v-for="section in layouts" :key="section.family" class="flex flex-col gap-4">
          <SectionHeader
            :title="FAMILY_LABELS[section.family]"
            :subtitle="`${section.unlocked} of ${section.total} unlocked`"
          />
          <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <li v-for="ladder in section.ladders" :key="ladder.key">
              <SeriesTile
                :ladder-key="ladder.key"
                :tiers="ladder.tiers"
                @open="openLadder = { ...ladder, family: section.family }"
              />
            </li>
            <li v-for="item in section.singles" :key="item.code">
              <SecretTrophyTile v-if="isMasked(item)" />
              <TrophyCard v-else :item="item" />
            </li>
          </ul>
        </section>
      </template>
    </div>

    <LadderDialog :ladder="openLadder" @close="openLadder = null" />
  </div>
</template>
