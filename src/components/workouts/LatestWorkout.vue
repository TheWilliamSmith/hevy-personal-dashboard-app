<script setup lang="ts">
import { RouterLink } from 'vue-router';

import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { WorkoutSummary } from '@/types/workouts';
import { formatDate, formatDuration, formatInteger, formatVolume } from '@/utils/format';

defineProps<{
  workout: WorkoutSummary | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader title="Latest workout" subtitle="Your most recent session" />

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <p v-else-if="!isLoading && !workout" class="text-sm text-zinc-500">No workout yet.</p>

    <template v-else>
      <div>
        <p
          class="text-5xl font-semibold tracking-tight text-white tabular-nums"
          :class="{ 'animate-pulse text-zinc-700': !workout }"
        >
          {{ workout ? formatVolume(workout.totalVolumeKg) : '—' }}
        </p>
        <p v-if="workout" class="mt-2 max-w-xs text-sm text-zinc-400">
          <span class="font-medium text-zinc-200">{{ workout.title }}</span> ·
          {{ formatDuration(workout.durationSec) }}, {{ formatInteger(workout.exerciseCount) }} exercises,
          {{ formatInteger(workout.setCount) }} sets.
        </p>
      </div>

      <div v-if="workout" class="mt-auto flex flex-col gap-2">
        <RouterLink
          :to="{ name: 'home', query: { tab: 'workouts', workout: workout.id } }"
          class="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Open workout
        </RouterLink>
        <p class="text-center text-xs text-zinc-500">
          <time :datetime="workout.startedAt">{{ formatDate(workout.startedAt) }}</time>
        </p>
      </div>
    </template>
  </section>
</template>
