<script setup lang="ts">
import { t } from '@/i18n';
</script>

<template>
  <article
    class="trophy-tile flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-800 p-4 text-center"
  >
    <span class="sr-only">{{ t('trophies.hiddenLocked') }}</span>
    <span
      class="flex h-11 w-11 items-center justify-center rounded-md bg-zinc-900 text-xl font-semibold text-zinc-600"
      aria-hidden="true"
    >
      ?
    </span>
    <p class="text-sm font-medium text-zinc-500" aria-hidden="true">{{ t('trophies.hidden') }}</p>
  </article>
</template>
