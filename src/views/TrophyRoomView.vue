<script setup lang="ts">
import { RouterLink } from 'vue-router';

import SecretTrophyTile from '@/components/achievements/SecretTrophyTile.vue';
import TrophyCard from '@/components/achievements/TrophyCard.vue';
import TrophyFilters from '@/components/achievements/TrophyFilters.vue';
import TrophyHero from '@/components/achievements/TrophyHero.vue';
import { useAchievements } from '@/composables/useAchievements';
import { FAMILY_LABELS } from '@/constants/achievements';
import { isMasked, ladderKey } from '@/utils/achievements';

const trophies = useAchievements();

const EMPTY: Record<string, string> = {
  unlocked: 'Nothing unlocked here yet — the first one is the hardest.',
  locked: 'Everything in this family is unlocked. Impressive.',
  progress: 'Nothing started here yet.',
  all: 'No achievements to show.',
};
</script>

<template>
  <div class="flex flex-col gap-4 px-4 pb-6 sm:px-6">
    <div
      v-if="trophies.error.value"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      role="alert"
    >
      <p class="text-sm text-red-900">{{ trophies.error.value }}</p>
      <button type="button" class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white" @click="trophies.refresh">
        Retry
      </button>
    </div>

    <template v-else>
      <div v-if="trophies.isLoading.value && trophies.totalCount.value === 0" class="grid gap-3 lg:grid-cols-3" aria-busy="true">
        <div v-for="block in 3" :key="block" class="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
      <TrophyHero
        v-else
        :level="trophies.level.value"
        :unlocked-count="trophies.unlockedCount.value"
        :total-count="trophies.totalCount.value"
        :rarity-counts="trophies.rarityCounts.value"
        :highlight="trophies.highlight.value"
      />

      <TrophyFilters
        :family="trophies.family.value"
        :show="trophies.show.value"
        @family="trophies.setFamily"
        @show="trophies.setShow"
      />

      <p
        v-if="trophies.unlockedCount.value === 0 && !trophies.isLoading.value && trophies.totalCount.value > 0"
        class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600"
      >
        No trophies yet.
        <RouterLink :to="{ name: 'home', query: { tab: 'imports' } }" aria-current-value="false" class="font-medium text-indigo-700 underline underline-offset-2">
          Import your Hevy history
        </RouterLink>
        — anything you have already done unlocks retroactively.
      </p>

      <div v-if="trophies.isLoading.value && trophies.totalCount.value === 0" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6" aria-busy="true">
        <div v-for="card in 12" :key="card" class="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>

      <p v-else-if="trophies.visibleCount.value === 0" class="py-12 text-center text-sm text-slate-500">
        {{ EMPTY[trophies.show.value] }}
      </p>

      <section v-for="section in trophies.sections.value" :key="section.family">
        <h2 class="mb-2 flex items-baseline gap-2 text-sm font-semibold text-slate-900">
          {{ FAMILY_LABELS[section.family] }}
          <span class="text-xs font-normal text-slate-500">{{ section.unlocked }} / {{ section.total }}</span>
        </h2>
        <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          <li v-for="item in section.items" :key="item.code">
            <SecretTrophyTile v-if="isMasked(item)" />
            <TrophyCard v-else :item="item" :ladder-size="trophies.ladders.value.get(ladderKey(item)) ?? 0" />
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
