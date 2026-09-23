<script setup lang="ts">
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';

import '@/charts/echarts';

defineProps<{ option: EChartsOption }>();

const emit = defineEmits<{ select: [dataIndex: number] }>();

function onClick(params: unknown): void {
  const event = params as { dataIndex?: number };
  if (typeof event.dataIndex === 'number') {
    emit('select', event.dataIndex);
  }
}
</script>

<template>
  <VChart :option="option" autoresize class="absolute inset-0" @click="onClick" />
</template>
