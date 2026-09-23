<script setup lang="ts">
import Sparkline from '@/components/charts/Sparkline.vue';
import type { ExerciseTrend } from '@/types/exercises';

/** Exercises-card wrapper: the shared sparkline plus the card's trend arrow. */
const props = withDefaults(
  defineProps<{
    points: readonly number[];
    trend: ExerciseTrend;
    width?: number;
    height?: number;
  }>(),
  { width: 96, height: 24 },
);

const TREND_COLORS: Readonly<Record<ExerciseTrend, string>> = {
  up: '#16a34a',
  down: '#dc2626',
  flat: '#64748b',
  insufficient_data: '#cbd5e1',
};

const ARROWS: Readonly<Record<ExerciseTrend, string>> = {
  up: '▲',
  down: '▼',
  flat: '▬',
  insufficient_data: '—',
};

const TREND_LABELS: Readonly<Record<ExerciseTrend, string>> = {
  up: 'Trending up',
  down: 'Trending down',
  flat: 'Flat',
  insufficient_data: 'Not enough sessions to show a trend',
};
</script>

<template>
  <div class="flex items-center gap-2">
    <Sparkline
      :points="props.points"
      :color="TREND_COLORS[props.trend]"
      :width="props.width"
      :height="props.height"
      :label="`${TREND_LABELS[props.trend]}, last ${props.points.length} sessions`"
    />
    <span
      class="text-xs"
      :style="{ color: TREND_COLORS[props.trend] }"
      :title="TREND_LABELS[props.trend]"
      aria-hidden="true"
    >
      {{ ARROWS[props.trend] }}
    </span>
  </div>
</template>
