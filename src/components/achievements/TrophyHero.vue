<script setup lang="ts">
import { computed } from 'vue';

import { RARITY_ORDER, RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem, Level, Rarity } from '@/types/achievements';
import { formatInteger } from '@/utils/format';

import TrophyCard from './TrophyCard.vue';

const props = defineProps<{
  level: Level | null;
  unlockedCount: number;
  totalCount: number;
  rarityCounts: Record<Rarity, number>;
  highlight: AchievementItem | null;
}>();

const xpPercent = computed(() =>
  props.level && props.level.needed > 0 ? Math.min(100, (props.level.into / props.level.needed) * 100) : 0,
);

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const completion = computed(() => (props.totalCount > 0 ? props.unlockedCount / props.totalCount : 0));
</script>

<template>
  <section class="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
    <div class="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white">
      <div class="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
        <span class="text-[10px] font-semibold tracking-wider uppercase opacity-80">Level</span>
        <span class="text-4xl leading-none font-bold tabular-nums">{{ props.level?.level ?? '·' }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium opacity-90">
          {{ formatInteger(props.level?.into ?? 0) }} / {{ formatInteger(props.level?.needed ?? 0) }} XP
        </p>
        <div
          class="mt-2 h-3 overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-label="Progress to the next level"
          :aria-valuenow="Math.round(xpPercent)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full rounded-full bg-white" :style="{ width: `${xpPercent}%` }" />
        </div>
        <p class="mt-2 text-xs opacity-80">{{ formatInteger(props.level?.totalXp ?? 0) }} XP in total</p>
      </div>
    </div>

    <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <svg viewBox="0 0 80 80" class="h-20 w-20 shrink-0 -rotate-90" role="img"
        :aria-label="`${props.unlockedCount} of ${props.totalCount} achievements unlocked`">
        <circle cx="40" cy="40" :r="RADIUS" fill="none" stroke="#e2e8f0" stroke-width="8" />
        <circle
          cx="40" cy="40" :r="RADIUS" fill="none" stroke="#6366f1" stroke-width="8" stroke-linecap="round"
          :stroke-dasharray="`${CIRCUMFERENCE * completion} ${CIRCUMFERENCE}`"
        />
      </svg>
      <div class="min-w-0 flex-1">
        <p class="text-lg font-semibold text-slate-900 tabular-nums">
          {{ props.unlockedCount }} <span class="text-sm font-normal text-slate-500">/ {{ props.totalCount }} unlocked</span>
        </p>
        <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <div v-for="rarity in RARITY_ORDER" :key="rarity" class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: RARITY_STYLES[rarity].hex }" aria-hidden="true" />
            <dt class="text-slate-500">{{ RARITY_STYLES[rarity].label }}</dt>
            <dd class="font-semibold text-slate-900 tabular-nums">{{ props.rarityCounts[rarity] }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="grid grid-rows-[auto_1fr] rounded-2xl border border-slate-200 bg-white p-3">
      <p class="px-1 pb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Rarest trophy</p>
      <TrophyCard v-if="props.highlight" :item="props.highlight" :ladder-size="0" />
      <p v-else class="px-1 py-6 text-center text-sm text-slate-500">
        Your first trophy is one workout away.
      </p>
    </div>
  </section>
</template>
