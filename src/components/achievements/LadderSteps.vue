<script setup lang="ts">
import { Check, Lock } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem } from '@/types/achievements';
import { describeAchievement, ladderProgress } from '@/utils/achievements';
import { formatDay } from '@/utils/format';

const props = defineProps<{ tiers: AchievementItem[] }>();

const current = computed(() => ladderProgress(props.tiers).current);

function state(tier: AchievementItem): 'done' | 'current' | 'next' {
  if (tier.unlocked) return 'done';
  return tier === current.value ? 'current' : 'next';
}

function workoutOf(tier: AchievementItem) {
  return tier.unlocked && tier.workoutId
    ? { name: 'home' as const, query: { tab: 'workouts', workout: tier.workoutId } }
    : null;
}
</script>

<template>
  <ol class="flex flex-col">
    <li v-for="(tier, index) in tiers" :key="tier.code" class="relative flex gap-3">
      <span
        v-if="index < tiers.length - 1"
        class="absolute top-7 bottom-0 left-[1.3rem] w-px"
        :class="tier.unlocked ? 'bg-emerald-400/40' : 'bg-zinc-800'"
        aria-hidden="true"
      />
      <component
        :is="workoutOf(tier) ? RouterLink : 'div'"
        :to="workoutOf(tier) ?? undefined"
        class="flex flex-1 items-start gap-3 rounded-md px-2 py-2"
        :class="[
          state(tier) === 'current' ? 'bg-zinc-800/70' : '',
          workoutOf(tier)
            ? 'transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400'
            : '',
        ]"
      >
        <span class="sr-only">{{ describeAchievement(tier) }}</span>
        <span
          class="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          :class="{
            'bg-emerald-400 text-zinc-950': state(tier) === 'done',
            'border border-blue-500 bg-zinc-900 text-blue-400': state(tier) === 'current',
            'border border-zinc-700 bg-zinc-900 text-zinc-600': state(tier) === 'next',
          }"
          aria-hidden="true"
        >
          <Check v-if="state(tier) === 'done'" class="h-3 w-3" :stroke-width="3" />
          <Lock v-else-if="state(tier) === 'next'" class="h-2.5 w-2.5" />
          <span v-else class="text-[10px] font-semibold">{{ tier.tier }}</span>
        </span>

        <span class="min-w-0 flex-1" aria-hidden="true">
          <span class="flex items-baseline justify-between gap-2">
            <span class="truncate text-sm" :class="state(tier) === 'next' ? 'text-zinc-500' : 'font-medium text-zinc-100'">
              {{ tier.name }}
            </span>
            <span
              class="shrink-0 text-[11px] tabular-nums"
              :class="state(tier) === 'next' ? 'text-zinc-600' : RARITY_STYLES[tier.rarity].text"
            >
              {{ RARITY_STYLES[tier.rarity].label }} · {{ tier.xp }} XP
            </span>
          </span>
          <span class="block text-[11px]" :class="state(tier) === 'next' ? 'text-zinc-600' : 'text-zinc-400'">
            {{ tier.description }}
            <template v-if="state(tier) === 'done' && tier.unlockedAt"> · unlocked {{ formatDay(tier.unlockedAt) }}</template>
          </span>
        </span>
      </component>
    </li>
  </ol>
</template>
