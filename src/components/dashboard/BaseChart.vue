<script setup lang="ts">
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';

// Side-effect import: registers the tree-shaken ECharts components. Living
// here keeps the library inside the dashboard's async chunk.
import '@/charts/echarts';

defineProps<{ option: EChartsOption }>();

/** Forwarded so a card can turn a bar into navigation. */
const emit = defineEmits<{ select: [dataIndex: number] }>();

function onClick(params: unknown): void {
  const event = params as { dataIndex?: number };
  if (typeof event.dataIndex === 'number') {
    emit('select', event.dataIndex);
  }
}
</script>

<template>
  <!--
    Absolutely positioned against ChartCard's relative wrapper. A percentage
    height would need a definite ancestor height, which the wrapper only has
    via min-height — that is not definite, so h-full collapsed to 0.
  -->
  <VChart :option="option" autoresize class="absolute inset-0" @click="onClick" />
</template>
