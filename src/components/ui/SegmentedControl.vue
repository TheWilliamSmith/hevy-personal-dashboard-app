<script setup lang="ts" generic="T extends string">
export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
  shortLabel?: string;
}

defineProps<{
  options: ReadonlyArray<SegmentedOption<T>>;
  modelValue: T;
  label: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<template>
  <fieldset class="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
    <legend class="sr-only">{{ label }}</legend>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400 sm:px-2.5"
      :class="modelValue === option.value ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-100'"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      <template v-if="option.shortLabel">
        <span class="sm:hidden">{{ option.shortLabel }}</span>
        <span class="hidden sm:inline">{{ option.label }}</span>
      </template>
      <template v-else>{{ option.label }}</template>
    </button>
  </fieldset>
</template>
