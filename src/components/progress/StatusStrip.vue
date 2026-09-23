<script setup lang="ts">
import { computed } from 'vue';

import { STATUS_ORDER, STATUS_STYLES } from '@/constants/progress';
import type { ProgressStatus, StatusCounts } from '@/types/progress';

const props = defineProps<{
  counts: StatusCounts;
  total: number;
  active: ProgressStatus | null;
  isLoading: boolean;
}>();

const emit = defineEmits<{ select: [status: ProgressStatus | null] }>();

/**
 * A radio group needs an option that means "no filter": once a radio is
 * chosen it cannot be unchosen, so without "All" the list could never be
 * shown unfiltered again. It sits first and stays neutral.
 */
const options = computed(() => [
  { value: null, label: 'All', count: props.total },
  ...STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_STYLES[status].label,
    count: props.counts[status],
  })),
]);

/** Arrow keys move the selection, as the radio-group pattern requires. */
function onKeydown(event: KeyboardEvent, index: number): void {
  const offset =
    event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0;
  if (offset === 0) {
    return;
  }
  event.preventDefault();
  const next = options.value[(index + offset + options.value.length) % options.value.length];
  if (next) {
    emit('select', next.value);
    const target = (event.currentTarget as HTMLElement).parentElement?.children[
      (index + offset + options.value.length) % options.value.length
    ] as HTMLElement | undefined;
    target?.focus();
  }
}

function classesFor(value: ProgressStatus | null): string {
  // bg-white only on the idle state: set on the base too, it would compete
  // with the selected background and the stylesheet order would pick the winner.
  const selected = props.active === value;
  if (value === null) {
    return selected
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  }
  return selected ? STATUS_STYLES[value].stripActive : `bg-white ${STATUS_STYLES[value].strip}`;
}
</script>

<template>
  <div
    class="grid grid-cols-3 gap-2 sm:grid-cols-6"
    role="radiogroup"
    aria-label="Filter by status"
  >
    <button
      v-for="(option, index) in options"
      :key="option.label"
      type="button"
      role="radio"
      :aria-checked="props.active === option.value"
      :tabindex="props.active === option.value ? 0 : -1"
      class="flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      :class="classesFor(option.value)"
      @click="emit('select', option.value)"
      @keydown="onKeydown($event, index)"
    >
      <span class="text-2xl leading-tight font-semibold tabular-nums">
        <template v-if="props.isLoading && props.total === 0">·</template>
        <template v-else>{{ option.count }}</template>
      </span>
      <span class="text-xs font-medium">{{ option.label }}</span>
    </button>
  </div>
</template>
