<script setup lang="ts">
import { t } from '@/i18n';
import Sparkline from '@/components/charts/Sparkline.vue';
import type { ExerciseTrend } from '@/types/exercises';

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
  up: '#34d399',
  down: '#f87171',
  flat: '#a1a1aa',
  insufficient_data: '#52525b',
};

const ARROWS: Readonly<Record<ExerciseTrend, string>> = {
  up: '▲',
  down: '▼',
  flat: '▬',
  insufficient_data: '—',
};

const TREND_LABELS: Readonly<Record<ExerciseTrend, string>> = {
  up: 'exercises.trendUp',
  down: 'exercises.trendDown',
  flat: 'exercises.trendFlat',
  insufficient_data: 'exercises.trendNone',
};
</script>

<template>
  <div class="flex items-center gap-2">
    <Sparkline
      :points="props.points"
      :color="TREND_COLORS[props.trend]"
      :width="props.width"
      :height="props.height"
      :label="t('exercises.trendLabel', { trend: t(TREND_LABELS[props.trend]), count: props.points.length })"
    />
    <span
      class="text-xs"
      :style="{ color: TREND_COLORS[props.trend] }"
      :title="t(TREND_LABELS[props.trend])"
      aria-hidden="true"
    >
      {{ ARROWS[props.trend] }}
    </span>
  </div>
</template>
