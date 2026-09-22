<script setup lang="ts">
const props = defineProps<{ options: ReadonlyArray<{ value: string; label: string }>; modelValue: string; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="flex overflow-hidden rounded-lg ring-1 ring-slate-300" role="group" :aria-label="props.label">
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="px-2.5 py-1 text-xs font-medium transition-colors"
      :class="
        props.modelValue === option.value
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      "
      :aria-pressed="props.modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
