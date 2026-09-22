<script setup lang="ts">
import type { SetType } from '@/types/workouts';
import { SET_TYPE_CLASSES, SET_TYPE_LABELS } from '@/utils/sets';

const props = defineProps<{ type: SetType }>();
</script>

<template>
  <span
    class="inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="SET_TYPE_CLASSES[props.type]"
  >
    {{ SET_TYPE_LABELS[props.type] }}
  </span>
</template>
