<script setup lang="ts">
import { computed } from 'vue';

import { initialsOf } from '@/utils/profile';

const props = withDefaults(defineProps<{ name: string; url: string | null; size?: 'sm' | 'lg' }>(), {
  size: 'sm',
});

const initials = computed(() => initialsOf(props.name));
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 font-semibold text-on-accent"
    :class="size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-8 w-8 text-xs'"
  >
    <img v-if="url" :src="url" :alt="name" class="h-full w-full object-cover" />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
