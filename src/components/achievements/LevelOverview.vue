<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { RARITY_ORDER, RARITY_STYLES } from '@/constants/achievements';
import type { Level, Rarity } from '@/types/achievements';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  level: Level | null;
  rarityCounts: Record<Rarity, number>;
  isLoading: boolean;
}>();

const xpPercent = computed(() =>
  props.level && props.level.needed > 0 ? Math.min(100, (props.level.into / props.level.needed) * 100) : 0,
);
</script>

<template>
  <section class="flex flex-col gap-6">
    <SectionHeader :title="t('trophies.levelTitle')" :subtitle="t('trophies.levelSubtitle')">
      <p class="text-right">
        <span
          class="text-2xl font-semibold text-white tabular-nums"
          :class="{ 'animate-pulse text-zinc-700': isLoading && !level }"
        >
          {{ formatInteger(level?.totalXp ?? 0) }}
        </span>
        <span class="block text-[11px] leading-tight text-zinc-500">{{ t('trophies.totalXp') }}</span>
      </p>
    </SectionHeader>

    <div class="flex items-center gap-4">
      <span class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border border-zinc-700">
        <span class="text-[10px] tracking-wider text-zinc-500 uppercase">{{ t('trophies.lvl') }}</span>
        <span class="text-xl leading-none font-semibold text-white tabular-nums">{{ level?.level ?? '·' }}</span>
      </span>
      <div class="min-w-0 flex-1">
        <p class="flex items-baseline justify-between gap-3 text-sm">
          <span class="text-zinc-200">{{ t('trophies.toLevel', { level: (level?.level ?? 0) + 1 }) }}</span>
          <span class="text-xs text-zinc-400 tabular-nums">
            {{ formatInteger(level?.into ?? 0) }} / {{ formatInteger(level?.needed ?? 0) }} XP
          </span>
        </p>
        <div
          class="mt-2 h-2 rounded-full bg-zinc-900"
          role="progressbar"
          :aria-label="t('trophies.levelProgress')"
          :aria-valuenow="Math.round(xpPercent)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full rounded-full bg-blue-500" :style="{ width: `${xpPercent}%` }" />
        </div>
      </div>
    </div>

    <dl class="grid grid-cols-2 gap-1 sm:grid-cols-4">
      <div v-for="rarity in RARITY_ORDER" :key="rarity" class="flex flex-col-reverse px-2.5 py-2">
        <dt class="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span class="h-2 w-2 shrink-0 rounded-full" :class="RARITY_STYLES[rarity].dot" aria-hidden="true" />
          {{ RARITY_STYLES[rarity].label }}
        </dt>
        <dd class="text-2xl font-semibold text-white tabular-nums">{{ formatInteger(rarityCounts[rarity]) }}</dd>
      </div>
    </dl>
  </section>
</template>
