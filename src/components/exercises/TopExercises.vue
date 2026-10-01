<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { MUSCLE_STYLES } from '@/constants/muscles';
import type { ExerciseCard } from '@/types/exercises';
import { formatInteger } from '@/utils/format';

const props = defineProps<{ exercises: ExerciseCard[]; isLoading: boolean }>();

const rows = computed(() => {
  const top = [...props.exercises]
    .filter((exercise) => exercise.sessions > 0)
    .sort((left, right) => right.sessions - left.sessions)
    .slice(0, 5);
  const max = top[0]?.sessions ?? 0;
  return top.map((exercise) => ({ exercise, share: max > 0 ? (exercise.sessions / max) * 100 : 0 }));
});
</script>

<template>
  <section class="flex h-full flex-col gap-5">
    <SectionHeader :title="t('exercises.mostTrained')" :subtitle="t('exercises.mostTrainedSubtitle')" />

    <ul v-if="isLoading && exercises.length === 0" class="flex flex-col gap-5" aria-hidden="true">
      <li v-for="index in 5" :key="index" class="h-6 animate-pulse rounded bg-zinc-900" />
    </ul>

    <EmptyState v-else-if="rows.length === 0" :message="t('exercises.noneYet')" />

    <ul v-else class="flex flex-col gap-1">
      <li v-for="row in rows" :key="row.exercise.id">
        <RouterLink
          :to="{ name: 'home', query: { tab: 'exercises', exercise: row.exercise.slug } }"
          class="block rounded-md px-2 py-2 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
        >
          <span class="flex items-center justify-between gap-3 text-sm">
            <span class="flex min-w-0 items-center gap-2 text-zinc-200">
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :style="{ backgroundColor: MUSCLE_STYLES[row.exercise.muscleGroup].hex }"
                aria-hidden="true"
              />
              <span class="truncate">{{ row.exercise.name }}</span>
            </span>
            <span class="shrink-0 text-xs text-zinc-400 tabular-nums">
              {{ t('exercises.sessionCount', { count: formatInteger(row.exercise.sessions) }, row.exercise.sessions) }}
            </span>
          </span>
          <span class="mt-1.5 block h-2 rounded-full bg-zinc-900">
            <span class="block h-full rounded-full bg-blue-500" :style="{ width: `${row.share}%` }" />
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
