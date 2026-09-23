<script setup lang="ts">
import { computed } from 'vue';

/**
 * Shared inline-SVG sparkline — one <path>, no chart runtime.
 *
 * Used by the Exercises cards and the Progress rows, where a page can hold
 * dozens: an ECharts instance per row would allocate a canvas and a resize
 * observer each to draw a 12-point line.
 */
const props = withDefaults(
  defineProps<{
    points: readonly number[];
    color: string;
    /** Indices to mark as personal records. */
    markers?: readonly number[];
    width?: number;
    height?: number;
    label: string;
  }>(),
  { markers: () => [], width: 96, height: 24 },
);

const PADDING = 3;

/** Under two points there is no honest line, so a muted dash is shown instead. */
const hasLine = computed(() => props.points.length >= 2);

const coords = computed(() => {
  const values = props.points;
  const min = Math.min(...values);
  const span = Math.max(...values) - min;
  const usable = props.height - PADDING * 2;
  const step = (props.width - PADDING * 2) / Math.max(1, values.length - 1);

  return values.map((value, index) => ({
    x: PADDING + index * step,
    // A flat series would divide by zero; park it on the vertical centre.
    y: span === 0 ? props.height / 2 : PADDING + usable - ((value - min) / span) * usable,
  }));
});

const path = computed(() =>
  coords.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' '),
);

const markerCoords = computed(() =>
  props.markers.map((index) => coords.value[index]).filter((point) => point !== undefined),
);
</script>

<template>
  <svg
    v-if="hasLine"
    :width="props.width"
    :height="props.height"
    :viewBox="`0 0 ${props.width} ${props.height}`"
    class="shrink-0 overflow-visible"
    role="img"
    :aria-label="props.label"
  >
    <path
      :d="path"
      fill="none"
      :stroke="props.color"
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
    <circle
      v-for="(point, index) in markerCoords"
      :key="index"
      :cx="point.x"
      :cy="point.y"
      r="2.5"
      :fill="props.color"
      stroke="#fff"
      stroke-width="1"
    />
  </svg>
  <span
    v-else
    class="inline-block shrink-0 text-xs text-slate-300"
    :style="{ width: `${props.width}px` }"
    role="img"
    :aria-label="props.label"
  >
    —
  </span>
</template>
