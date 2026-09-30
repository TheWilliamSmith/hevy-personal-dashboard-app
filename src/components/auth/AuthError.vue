<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

defineProps<{ message: string | null }>();
</script>

<template>
  <div
    v-if="message"
    class="flex items-start gap-2.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
    role="alert"
  >
    <CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
    <p>{{ message }}</p>
  </div>
</template>
