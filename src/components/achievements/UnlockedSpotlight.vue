<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem } from '@/types/achievements';
import { formatDay, formatInteger } from '@/utils/format';

import AchievementIcon from './AchievementIcon.vue';

const props = defineProps<{
  unlockedCount: number;
  totalCount: number;
  highlight: AchievementItem | null;
  isLoading: boolean;
}>();

const percent = computed(() =>
  props.totalCount > 0 ? Math.round((props.unlockedCount / props.totalCount) * 100) : 0,
);

const target = computed(() =>
  props.highlight?.workoutId
    ? { name: 'home' as const, query: { tab: 'workouts', workout: props.highlight.workoutId } }
    : null,
);
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader :title="t('trophies.unlockedTitle')" :subtitle="t('trophies.unlockedSubtitle')" />

    <div>
      <p
        class="text-5xl font-semibold tracking-tight text-white tabular-nums"
        :class="{ 'animate-pulse text-zinc-700': isLoading && totalCount === 0 }"
      >
        {{ formatInteger(unlockedCount) }}<span class="text-3xl text-zinc-500"> / {{ formatInteger(totalCount) }}</span>
      </p>
      <p class="mt-2 max-w-xs text-sm text-zinc-400">
        {{ t('trophies.shareOfRoom', { percent }) }}
        <template v-if="unlockedCount === 0 && totalCount > 0">
          {{ t('trophies.retroactive') }}
        </template>
      </p>
    </div>

    <div v-if="highlight" class="mt-auto flex flex-col gap-2">
      <p class="text-xs text-zinc-500">{{ t('trophies.rarest') }}</p>
      <component
        :is="target ? RouterLink : 'div'"
        :to="target ?? undefined"
        class="flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
        :class="target ? 'hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400' : ''"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" :class="RARITY_STYLES[highlight.rarity].badge">
          <AchievementIcon :name="highlight.icon" :size="20" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-zinc-100">{{ highlight.name }}</span>
          <span class="block text-[11px]" :class="RARITY_STYLES[highlight.rarity].text">
            {{ RARITY_STYLES[highlight.rarity].label }} · {{ highlight.xp }} XP
          </span>
        </span>
        <span v-if="highlight.unlockedAt" class="shrink-0 text-xs text-zinc-500">{{ formatDay(highlight.unlockedAt) }}</span>
      </component>
    </div>
  </section>
</template>
