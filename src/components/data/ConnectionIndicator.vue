<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useHevyConnection } from '@/composables/useHevyConnection';

const connection = useHevyConnection();

const DOT_CLASS: Readonly<Record<string, string>> = {
  connected: 'bg-emerald-500',
  attention: 'bg-amber-500',
  disconnected: 'bg-slate-300',
  unknown: 'bg-slate-200',
};

const label = computed(() => {
  const tone = connection.indicatorTone.value;
  if (tone === 'connected') {
    return 'Hevy connected and up to date';
  }
  if (tone === 'attention') {
    return 'Hevy connected, needs attention';
  }
  if (tone === 'disconnected') {
    return 'Hevy not connected';
  }
  return 'Checking Hevy connection…';
});
</script>

<template>
  <RouterLink
    :to="{ name: 'home', query: { tab: 'data' } }"
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
    :title="label"
  >
    <span
      class="h-2 w-2 rounded-full"
      :class="DOT_CLASS[connection.indicatorTone.value]"
      aria-hidden="true"
    />
    <span class="sr-only">{{ label }}</span>
  </RouterLink>
</template>
