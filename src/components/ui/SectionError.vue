<script setup lang="ts">
import { t } from '@/i18n';
defineProps<{ message: string }>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="flex items-center justify-between gap-3 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2" role="alert">
    <p class="text-xs text-red-200">{{ message }}</p>
    <button
      type="button"
      class="rounded-md border border-red-800 px-2 py-1 text-xs font-medium text-red-100 hover:bg-red-900/50"
      @click="emit('retry')"
    >
      {{ t('common.retry') }}
    </button>
  </div>
</template>
