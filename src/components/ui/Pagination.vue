<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

import type { PaginationMeta } from '@/types/workouts';

defineProps<{ meta: PaginationMeta; label: string; unit: string }>();
const emit = defineEmits<{ change: [page: number] }>();

const button =
  'inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-40';
</script>

<template>
  <nav class="flex items-center justify-between gap-4" :aria-label="label">
    <button type="button" :class="button" :disabled="meta.page <= 1" @click="emit('change', meta.page - 1)">
      <ChevronLeft class="h-4 w-4" aria-hidden="true" />
      {{ t('common.previous') }}
    </button>

    <p class="text-xs text-zinc-400 tabular-nums">
      {{ t('common.pageOf', { page: meta.page, total: meta.totalPages }) }}
      <span class="text-zinc-500">· {{ meta.total }} {{ unit }}</span>
    </p>

    <button
      type="button"
      :class="button"
      :disabled="meta.page >= meta.totalPages"
      @click="emit('change', meta.page + 1)"
    >
      {{ t('common.next') }}
      <ChevronRight class="h-4 w-4" aria-hidden="true" />
    </button>
  </nav>
</template>
