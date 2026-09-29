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
import { computed, type Component } from 'vue';
import { RouterLink } from 'vue-router';

import SectionError from '@/components/home/SectionError.vue';
import SectionHeader from '@/components/home/SectionHeader.vue';
import type { Overview } from '@/types/stats';
import { formatDuration, formatInteger, formatNumber, formatVolume } from '@/utils/format';

const props = defineProps<{
  overview: Overview | null;
  rangeLabel: string;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

interface Metric {
  label: string;
  value: string;
  icon: Component;
}

const metrics = computed<Metric[]>(() => {
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

function cellClass(index: number): string[] {
  return [
    index % 2 === 1 ? 'sm:border-l sm:pl-6' : 'sm:pl-0',
    index % 4 === 0 ? 'xl:border-l-0 xl:pl-0' : 'xl:border-l xl:pl-6',
  ];
}
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

    <dl v-else class="grid grid-cols-1 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="(metric, index) in metrics"
        :key="metric.label"
        class="flex items-start justify-between gap-3 border-zinc-800 sm:pr-6"
        :class="cellClass(index)"
      >
        <div class="flex min-w-0 flex-col-reverse">
          <dt class="mt-1 text-xs text-zinc-500">{{ metric.label }}</dt>
          <dd
            class="truncate text-2xl font-semibold text-white tabular-nums"
            :class="{ 'animate-pulse text-zinc-700': isLoading && !overview }"
          >
            {{ metric.value }}
          </dd>
        </div>
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 text-zinc-300">
          <component :is="metric.icon" class="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </dl>
  </section>
</template>
