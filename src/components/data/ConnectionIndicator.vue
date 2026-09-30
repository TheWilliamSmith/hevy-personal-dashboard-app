<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useHevyConnection } from '@/composables/useHevyConnection';

const connection = useHevyConnection();

const DOT_CLASS: Readonly<Record<string, string>> = {
  connected: 'bg-emerald-500',
  attention: 'bg-amber-500',
  disconnected: 'bg-zinc-500',
  unknown: 'bg-zinc-700',
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
    :to="{ name: 'home', query: { tab: 'settings', section: 'data' } }"
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-900"
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
