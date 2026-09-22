<script setup lang="ts">
import type { Granularity } from '@/types/stats';
import {
  GRANULARITIES,
  RANGE_PRESETS,
  type RangePreset,
} from '@/composables/stats/useDashboardFilters';

const props = defineProps<{
  preset: RangePreset;
  granularity: Granularity;
  customFrom: string;
  customTo: string;
}>();

const emit = defineEmits<{
  preset: [value: RangePreset];
  customRange: [from: string, to: string];
  granularity: [value: Granularity];
}>();

const segment =
  'px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg';
const active = 'bg-indigo-600 text-white';
const inactive = 'bg-white text-slate-600 hover:bg-slate-50';
const dateField =
  'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none';
</script>

<template>
  <div
    class="sticky top-0 z-20 -mx-6 mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-200 bg-slate-100/95 px-6 py-3 backdrop-blur"
  >
    <div class="flex items-center gap-2">
      <span id="range-label" class="text-xs font-medium text-slate-600">Range</span>
      <div class="flex overflow-hidden rounded-lg ring-1 ring-slate-300" role="group" aria-labelledby="range-label">
        <button
          v-for="option in RANGE_PRESETS"
          :key="option.value"
          type="button"
          :class="[segment, props.preset === option.value ? active : inactive]"
          :aria-pressed="props.preset === option.value"
          @click="emit('preset', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <label for="range-from" class="text-xs font-medium text-slate-600">From</label>
      <input
        id="range-from"
        type="date"
        :value="props.customFrom"
        :max="props.customTo || undefined"
        :class="dateField"
        @change="emit('customRange', ($event.target as HTMLInputElement).value, props.customTo)"
      />
      <label for="range-to" class="text-xs font-medium text-slate-600">To</label>
      <input
        id="range-to"
        type="date"
        :value="props.customTo"
        :min="props.customFrom || undefined"
        :class="dateField"
        @change="emit('customRange', props.customFrom, ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex items-center gap-2">
      <span id="granularity-label" class="text-xs font-medium text-slate-600">Granularity</span>
      <div
        class="flex overflow-hidden rounded-lg ring-1 ring-slate-300"
        role="group"
        aria-labelledby="granularity-label"
      >
        <button
          v-for="option in GRANULARITIES"
          :key="option.value"
          type="button"
          :class="[segment, props.granularity === option.value ? active : inactive]"
          :aria-pressed="props.granularity === option.value"
          @click="emit('granularity', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>
