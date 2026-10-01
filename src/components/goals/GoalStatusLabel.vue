<script setup lang="ts">
import { GOAL_STATUS_STYLES } from '@/constants/goals';
import type { GoalStatus } from '@/types/goals';

defineProps<{ status: GoalStatus }>();
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-xs" :class="GOAL_STATUS_STYLES[status].text">
    <span class="h-1.5 w-1.5 rounded-full" :class="GOAL_STATUS_STYLES[status].dot" aria-hidden="true" />
    {{ GOAL_STATUS_STYLES[status].label }}
  </span>
</template>
