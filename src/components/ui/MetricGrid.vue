<script setup lang="ts">
import type { Component } from 'vue';

export interface MetricItem {
  label: string;
  value: string;
  icon: Component;
}

defineProps<{ items: MetricItem[]; isLoading: boolean }>();

function cellClass(index: number): string[] {
  return [
    index % 2 === 1 ? 'sm:border-l sm:pl-6' : 'sm:pl-0',
    index % 4 === 0 ? 'xl:border-l-0 xl:pl-0' : 'xl:border-l xl:pl-6',
  ];
}
</script>

<template>
  <dl class="grid grid-cols-1 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="(item, index) in items"
      :key="item.label"
      class="flex items-start justify-between gap-3 border-zinc-800 sm:pr-6"
      :class="cellClass(index)"
    >
      <div class="flex min-w-0 flex-col-reverse">
        <dt class="mt-1 text-xs text-zinc-500">{{ item.label }}</dt>
        <dd
          class="truncate text-2xl font-semibold text-white tabular-nums"
          :class="{ 'animate-pulse text-zinc-700': isLoading }"
        >
          {{ item.value }}
        </dd>
      </div>
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 text-zinc-300">
        <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  </dl>
</template>
