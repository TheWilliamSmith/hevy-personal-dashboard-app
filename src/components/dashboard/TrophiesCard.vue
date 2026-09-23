<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { RouterLink } from 'vue-router';

import { RARITY_STYLES } from '@/constants/achievements';
import type { AchievementsSummary } from '@/types/achievements';
import { formatDay, formatInteger } from '@/utils/format';

import ChartCard from './ChartCard.vue';

/** Icons load with the card's chunk, not the Dashboard's first paint. */
const AchievementIcon = defineAsyncComponent(
  () => import('@/components/achievements/AchievementIcon.vue'),
);

const props = defineProps<{
  summary: AchievementsSummary | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const level = computed(() => props.summary?.level ?? null);
const percent = computed(() =>
  level.value && level.value.needed > 0 ? Math.min(100, (level.value.into / level.value.needed) * 100) : 0,
);
</script>

<template>
  <ChartCard
    title="Trophies"
    :subtitle="props.summary ? `${props.summary.unlockedCount} / ${props.summary.totalCount} unlocked` : ''"
    :is-loading="props.isLoading"
    :error="props.error"
    :height="220"
    @retry="emit('retry')"
  >
    <template #toolbar>
      <RouterLink :to="{ name: 'home', query: { tab: 'trophies' } }" aria-current-value="false"
        class="text-xs font-medium text-indigo-700 underline underline-offset-2">
        Open Trophies
      </RouterLink>
    </template>

    <div class="flex h-full flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white">
          <span class="text-[9px] font-semibold uppercase opacity-80">Lvl</span>
          <span class="text-lg leading-none font-bold tabular-nums">{{ level?.level ?? '·' }}</span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs text-slate-600 tabular-nums">
            {{ formatInteger(level?.into ?? 0) }} / {{ formatInteger(level?.needed ?? 0) }} XP
          </p>
          <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar"
            aria-label="Progress to the next level" :aria-valuenow="Math.round(percent)" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-full bg-indigo-600" :style="{ width: `${percent}%` }" />
          </div>
        </div>
      </div>

      <ul v-if="props.summary && props.summary.recentUnlocks.length > 0" class="flex flex-col gap-2">
        <li v-for="unlock in props.summary.recentUnlocks" :key="unlock.code" class="flex items-center gap-2 text-sm">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="RARITY_STYLES[unlock.rarity].badge">
            <AchievementIcon :name="unlock.icon" :size="16" />
          </span>
          <span class="min-w-0 flex-1 truncate text-slate-800">{{ unlock.name }}</span>
          <span class="text-[11px] text-slate-500">{{ formatDay(unlock.unlockedAt) }}</span>
        </li>
      </ul>
      <p v-else class="text-sm text-slate-500">No trophies yet — your first one is one workout away.</p>
    </div>
  </ChartCard>
</template>
