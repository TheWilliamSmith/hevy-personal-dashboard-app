<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <h2 class="text-sm font-medium text-zinc-100">{{ title }}</h2>
      <p v-if="subtitle" class="mt-0.5 text-xs text-zinc-500">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>
