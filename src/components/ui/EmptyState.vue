<script setup lang="ts">
import { t } from '@/i18n';
import { RouterLink } from 'vue-router';

withDefaults(
  defineProps<{
    message: string;
    overlay?: boolean;
    importLink?: boolean;
  }>(),
  { overlay: false, importLink: false },
);
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-2 px-4 text-center"
    :class="overlay ? 'absolute inset-0' : 'min-h-48 flex-1'"
  >
    <p class="text-sm text-zinc-500">{{ message }}</p>
    <RouterLink
      v-if="importLink"
      :to="{ name: 'home', query: { tab: 'settings', section: 'data' } }"
      class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
    >
      {{ t('common.connectOrImport') }}
    </RouterLink>
    <slot />
  </div>
</template>
