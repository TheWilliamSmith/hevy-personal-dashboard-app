<script setup lang="ts">
import { computed } from 'vue';

import EmptyState from '@/components/ui/EmptyState.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { WorkoutExerciseDetail } from '@/types/workouts';
import { formatVolume } from '@/utils/format';

const props = defineProps<{ exercises: WorkoutExerciseDetail[]; totalVolumeKg: number }>();

const rows = computed(() =>
  props.exercises
    .filter((exercise) => exercise.volumeKg > 0)
    .sort((left, right) => right.volumeKg - left.volumeKg)
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      volumeKg: exercise.volumeKg,
      share: props.totalVolumeKg > 0 ? (exercise.volumeKg / props.totalVolumeKg) * 100 : 0,
    })),
);
</script>

<template>
  <section class="flex h-full flex-col gap-5">
    <SectionHeader title="Volume by exercise" subtitle="Share of the workout volume, warm-ups included" />

    <EmptyState v-if="rows.length === 0" message="No weighted work in this workout." />

    <ul v-else class="flex flex-col gap-4">
      <li v-for="row in rows" :key="row.id">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="min-w-0 truncate text-zinc-200">{{ row.name }}</span>
          <span class="shrink-0 text-xs text-zinc-400 tabular-nums">
            <span class="text-zinc-100">{{ formatVolume(row.volumeKg) }}</span> · {{ row.share.toFixed(1) }}%
          </span>
        </div>
        <div class="mt-1.5 h-2 rounded-full bg-zinc-900">
          <div class="h-full rounded-full bg-blue-500" :style="{ width: `${row.share}%` }" />
        </div>
      </li>
    </ul>
  </section>
</template>
