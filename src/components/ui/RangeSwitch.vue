<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';

import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { RANGE_PRESETS, type RangePreset } from '@/composables/stats/useDashboardFilters';

defineProps<{ modelValue: RangePreset }>();
const emit = defineEmits<{ 'update:modelValue': [value: RangePreset] }>();

const SHORT_KEYS: Readonly<Record<string, string>> = {
  '30d': 'ranges.short30d',
  '3m': 'ranges.short3m',
  '6m': 'ranges.short6m',
  '1y': 'ranges.short1y',
  all: 'ranges.shortAll',
};

const options = computed<ReadonlyArray<SegmentedOption<RangePreset>>>(() =>
  RANGE_PRESETS.map((preset) => ({
    value: preset.value,
    label: preset.label,
    shortLabel: t(SHORT_KEYS[preset.value] ?? 'ranges.shortAll'),
  })),
);
</script>

<template>
  <SegmentedControl
    :options="options"
    :model-value="modelValue"
    :label="t('ranges.period')"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
