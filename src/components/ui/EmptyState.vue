<script setup lang="ts">
import { RouterLink } from 'vue-router';

withDefaults(
  defineProps<{
    message: string;
    /** Covers a positioned parent, e.g. a fixed-height chart area. */
    overlay?: boolean;
    /** Adds the "Connect Hevy or import a CSV export" link. */
    importLink?: boolean;
  }>(),
  { overlay: false, importLink: false },
);
</script>

<template>
  <div
    role="status"
    class="flex flex-col items-center justify-center gap-2 px-4 text-center"
    :class="overlay ? 'absolute inset-0' : 'min-h-48 flex-1'"
  >
    <p class="text-sm text-zinc-500">{{ message }}</p>
    <RouterLink
      v-if="importLink"
      :to="{ name: 'home', query: { tab: 'settings', section: 'data' } }"
      class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
    >
      Connect Hevy or import a CSV export
    </RouterLink>
    <slot />
  </div>
</template>
