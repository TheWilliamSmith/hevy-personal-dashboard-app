<script setup lang="ts">
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';

// Side-effect import: registers the tree-shaken ECharts components. Living
// here keeps the library inside the dashboard's async chunk.
import '@/charts/echarts';

defineProps<{ option: EChartsOption }>();
</script>

<template>
  <VChart :option="option" autoresize class="h-full w-full" />
</template>
