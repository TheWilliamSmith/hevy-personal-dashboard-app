<script setup lang="ts">
import { computed } from 'vue';

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

/**
 * Inline SVG rather than an ECharts instance.
 *
 * A muscle section can hold 50+ cards; each ECharts instance allocates a canvas
 * and a resize observer, so a full catalog would mount dozens of them and cost
 * far more than the polyline they would draw. This renders one <path> and
 * nothing else — no runtime, no canvas, no observer.
 */
const TREND_COLORS: Readonly<Record<ExerciseTrend, string>> = {
  up: '#16a34a',
  down: '#dc2626',
  flat: '#64748b',
  insufficient_data: '#cbd5e1',
};

/** Two points are the minimum for a line that means anything. */
const hasLine = computed(() => props.points.length >= 2);

const color = computed(() => TREND_COLORS[props.trend]);

const path = computed(() => {
  const values = props.points;
  if (values.length < 2) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const stepX = props.width / (values.length - 1);
  // A flat series would divide by zero; park it on the vertical centre.
  const padding = 2;
  const usable = props.height - padding * 2;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = span === 0 ? props.height / 2 : padding + usable - ((value - min) / span) * usable;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});

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
    <!--
      Without two points there is no honest line to draw, so a muted dash is
      rendered instead of a flat one that would imply a measured plateau.
    -->
    <svg
      v-if="hasLine"
      :width="props.width"
      :height="props.height"
      :viewBox="`0 0 ${props.width} ${props.height}`"
      class="overflow-visible"
      role="img"
      :aria-label="`${TREND_LABELS[props.trend]}, last ${props.points.length} sessions`"
    >
      <path :d="path" fill="none" :stroke="color" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
    <span
      v-else
      class="text-xs text-slate-300"
      :style="{ width: `${props.width}px` }"
      :aria-label="TREND_LABELS[props.trend]"
      role="img"
    >
      —
    </span>

    <span
      class="text-xs"
      :style="{ color }"
      :title="TREND_LABELS[props.trend]"
      aria-hidden="true"
    >
      {{ ARROWS[props.trend] }}
    </span>
  </div>
</template>
