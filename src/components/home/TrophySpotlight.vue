<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { AchievementsSummary } from '@/types/achievements';
import { formatDay, formatInteger } from '@/utils/format';

const props = defineProps<{
  summary: AchievementsSummary | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const percent = computed(() => {
  const summary = props.summary;
  if (!summary || summary.totalCount === 0) {
    return 0;
  }
  return Math.round((summary.unlockedCount / summary.totalCount) * 100);
});

const latest = computed(() => props.summary?.recentUnlocks[0] ?? null);
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader :title="t('dashboard.trophies.title')" :subtitle="t('dashboard.trophies.subtitle')" />

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <template v-else>
      <div>
        <p
          class="text-5xl font-semibold tracking-tight text-white tabular-nums"
          :class="{ 'animate-pulse text-zinc-700': isLoading && !summary }"
        >
          {{ percent }}%
        </p>
        <p class="mt-2 max-w-xs text-sm text-zinc-400">
          <template v-if="summary">
            {{
              t('dashboard.trophies.summary', {
                unlocked: formatInteger(summary.unlockedCount),
                total: formatInteger(summary.totalCount),
                level: summary.level.level,
                into: formatInteger(summary.level.into),
                needed: formatInteger(summary.level.needed),
              })
            }}
          </template>
          <template v-else>{{ t('dashboard.trophies.loading') }}</template>
        </p>
      </div>

      <div class="mt-auto flex flex-col gap-2">
        <RouterLink
          :to="{ name: 'home', query: { tab: 'trophies' } }"
          class="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {{ t('dashboard.trophies.open') }}
        </RouterLink>
        <p class="text-center text-xs text-zinc-500">
          <template v-if="latest">
            {{ t('dashboard.trophies.latest', { name: latest.name, date: formatDay(latest.unlockedAt) }) }}
          </template>
          <template v-else-if="summary">{{ t('dashboard.trophies.first') }}</template>
        </p>
      </div>
    </template>
  </section>
</template>
