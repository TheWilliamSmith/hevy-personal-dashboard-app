<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { MUSCLE_LABELS } from '@/constants/muscles';
import type { MuscleGroup } from '@/types/stats';
import { formatPercent } from '@/utils/format';

export interface RankingEntry {
  muscleGroup: MuscleGroup;
  value: number;
  share: number;
  change: number | null;
}

defineProps<{
  entries: RankingEntry[];
  highlighted: MuscleGroup | null;
  format: (value: number) => string;
}>();

const emit = defineEmits<{ highlight: [group: MuscleGroup | null] }>();

function exercisesOf(group: MuscleGroup) {
  return { name: 'home' as const, query: { tab: 'exercises', muscles: group } };
}

function changeClass(change: number | null): string {
  if (change === null) {
    return 'text-zinc-600';
  }
  return change >= 0 ? 'text-emerald-400' : 'text-red-400';
}
</script>

<template>
  <ul class="flex flex-col gap-1" @pointerleave="emit('highlight', null)">
    <li v-for="entry in entries" :key="entry.muscleGroup">
      <RouterLink
        :to="exercisesOf(entry.muscleGroup)"
        class="block rounded-md px-2 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
        :class="highlighted === entry.muscleGroup ? 'bg-zinc-900' : 'hover:bg-zinc-900'"
        @pointerenter="emit('highlight', entry.muscleGroup)"
        @focus="emit('highlight', entry.muscleGroup)"
        @blur="emit('highlight', null)"
      >
        <span class="flex items-baseline gap-3 text-sm">
          <span class="min-w-0 flex-1 truncate text-zinc-200">{{ MUSCLE_LABELS[entry.muscleGroup] }}</span>
          <span class="text-zinc-100 tabular-nums">{{ format(entry.value) }}</span>
          <span class="w-14 text-right text-xs whitespace-nowrap tabular-nums" :class="changeClass(entry.change)">
            {{ entry.change === null ? '—' : formatPercent(entry.change) }}
          </span>
        </span>
        <span class="mt-1.5 block h-1.5 rounded-full bg-zinc-900">
          <span class="block h-full rounded-full bg-blue-500" :style="{ width: `${entry.share}%` }" />
        </span>
      </RouterLink>
    </li>
  </ul>
</template>
