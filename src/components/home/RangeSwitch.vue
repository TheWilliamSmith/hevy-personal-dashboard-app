<script setup lang="ts">
import { RANGE_PRESETS, type RangePreset } from '@/composables/stats/useDashboardFilters';

defineProps<{ modelValue: RangePreset }>();

const SHORT_LABELS: Readonly<Record<string, string>> = {
  '30d': '30D',
  '3m': '3M',
  '6m': '6M',
  '1y': '1Y',
  all: 'All',
};
const emit = defineEmits<{ 'update:modelValue': [value: RangePreset] }>();
</script>

<template>
  <div class="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5" role="group" aria-label="Period">
    <button
      v-for="preset in RANGE_PRESETS"
      :key="preset.value"
      type="button"
      class="rounded px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors sm:px-2.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
      :class="modelValue === preset.value ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-100'"
      :aria-pressed="modelValue === preset.value"
      @click="emit('update:modelValue', preset.value)"
    >
      <span class="sm:hidden">{{ SHORT_LABELS[preset.value] }}</span>
      <span class="hidden sm:inline">{{ preset.label }}</span>
    </button>
  </div>
</template>
