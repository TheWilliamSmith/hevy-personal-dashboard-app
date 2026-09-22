<script setup lang="ts">
import type { PaginationMeta } from '@/types/workouts';

const props = defineProps<{ meta: PaginationMeta }>();
const emit = defineEmits<{ change: [page: number] }>();

const button =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
</script>

<template>
  <nav class="flex items-center justify-between gap-4" aria-label="Workouts pagination">
    <button
      type="button"
      :class="button"
      :disabled="props.meta.page <= 1"
      @click="emit('change', props.meta.page - 1)"
    >
      Previous
    </button>

    <p class="text-sm text-slate-600">
      Page {{ props.meta.page }} of {{ props.meta.totalPages }}
      <span class="text-slate-400">({{ props.meta.total }} workouts)</span>
    </p>

    <button
      type="button"
      :class="button"
      :disabled="props.meta.page >= props.meta.totalPages"
      @click="emit('change', props.meta.page + 1)"
    >
      Next
    </button>
  </nav>
</template>
