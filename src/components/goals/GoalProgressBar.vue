<script setup lang="ts">
import { GOAL_STATUS_STYLES } from '@/constants/goals';
import type { GoalStatus } from '@/types/goals';

defineProps<{ percent: number; status: GoalStatus; label: string }>();
</script>

<template>
  <div
    class="h-2 rounded-full bg-zinc-900"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
  >
    <div class="h-full rounded-full" :class="GOAL_STATUS_STYLES[status].bar" :style="{ width: `${percent}%` }" />
  </div>
</template>
