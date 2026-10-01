<script setup lang="ts">
import { t } from '@/i18n';
import {
  CalendarCheck,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  Repeat,
  Timer,
  Weight,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import MetricGrid, { type MetricItem } from '@/components/ui/MetricGrid.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { Overview } from '@/types/stats';
import { formatDuration, formatInteger, formatNumber, formatVolume } from '@/utils/format';

const props = defineProps<{
  overview: Overview | null;
  rangeLabel: string;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const metrics = computed<MetricItem[]>(() => {
  const stats = props.overview;
  return [
    { label: t('dashboard.workouts'), value: formatInteger(stats?.totalWorkouts), icon: Dumbbell },
    { label: t('dashboard.totalVolume'), value: formatVolume(stats?.totalVolumeKg), icon: Weight },
    { label: t('dashboard.sets'), value: formatInteger(stats?.totalSets), icon: Layers },
    { label: t('dashboard.reps'), value: formatInteger(stats?.totalReps), icon: Repeat },
    { label: t('dashboard.timeTrained'), value: formatDuration(stats?.totalDurationSec), icon: Clock },
    { label: t('dashboard.avgSession'), value: formatDuration(stats?.avgDurationSec), icon: Timer },
    {
      label: t('dashboard.weeklyStreak'),
      value: stats ? t('dashboard.streakWeeks', { count: formatInteger(stats.currentStreakWeeks) }) : formatInteger(null),
      icon: Flame,
    },
    { label: t('dashboard.workoutsPerWeek'), value: formatNumber(stats?.workoutsPerWeekAvg), icon: CalendarCheck },
  ];
});
</script>

<template>
  <section class="flex flex-col gap-5">
    <SectionHeader :title="t('dashboard.keyMetrics')" :subtitle="rangeLabel">
      <RouterLink
        :to="{ name: 'home', query: { tab: 'workouts' } }"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        {{ t('dashboard.allWorkouts') }}
      </RouterLink>
    </SectionHeader>

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <MetricGrid v-else :items="metrics" :is-loading="isLoading && !overview" />
  </section>
</template>
