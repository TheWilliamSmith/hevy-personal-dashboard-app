<script setup lang="ts">
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { RANGE_PRESETS, type RangePreset } from '@/composables/stats/useDashboardFilters';

defineProps<{ modelValue: RangePreset }>();
const emit = defineEmits<{ 'update:modelValue': [value: RangePreset] }>();

const SHORT_LABELS: Readonly<Record<string, string>> = {
  '30d': '30D',
  '3m': '3M',
  '6m': '6M',
  '1y': '1Y',
  all: 'All',
};

const OPTIONS: ReadonlyArray<SegmentedOption<RangePreset>> = RANGE_PRESETS.map((preset) => ({
  value: preset.value,
  label: preset.label,
  shortLabel: SHORT_LABELS[preset.value],
}));
</script>

<template>
  <SegmentedControl
    :options="OPTIONS"
    :model-value="modelValue"
    label="Period"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
