<script setup lang="ts">
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
    { label: 'Workouts', value: formatInteger(stats?.totalWorkouts), icon: Dumbbell },
    { label: 'Total volume', value: formatVolume(stats?.totalVolumeKg), icon: Weight },
    { label: 'Sets', value: formatInteger(stats?.totalSets), icon: Layers },
    { label: 'Reps', value: formatInteger(stats?.totalReps), icon: Repeat },
    { label: 'Time trained', value: formatDuration(stats?.totalDurationSec), icon: Clock },
    { label: 'Avg session', value: formatDuration(stats?.avgDurationSec), icon: Timer },
    {
      label: 'Weekly streak',
      value: stats ? `${formatInteger(stats.currentStreakWeeks)} wk` : formatInteger(null),
      icon: Flame,
    },
    { label: 'Workouts / week', value: formatNumber(stats?.workoutsPerWeekAvg), icon: CalendarCheck },
  ];
});
</script>

<template>
  <section class="flex flex-col gap-5">
    <SectionHeader title="Key metrics" :subtitle="rangeLabel">
      <RouterLink
        :to="{ name: 'home', query: { tab: 'workouts' } }"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        All workouts
      </RouterLink>
    </SectionHeader>

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <MetricGrid v-else :items="metrics" :is-loading="isLoading && !overview" />
  </section>
</template>
