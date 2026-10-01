<script setup lang="ts">
import { t } from '@/i18n';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';

import GoalProgressBar from '@/components/goals/GoalProgressBar.vue';
import GoalStatusLabel from '@/components/goals/GoalStatusLabel.vue';
import type { Goal } from '@/types/goals';
import { formatGoalValue, goalTiming, goalTitle } from '@/utils/goals';

defineProps<{ goal: Goal; busy: boolean }>();
const emit = defineEmits<{ edit: []; archive: []; restore: []; remove: [] }>();

const iconButton =
  'rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <li class="flex flex-col gap-3 border-b border-zinc-800 py-4 last:border-b-0">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-zinc-100">
          <RouterLink
            v-if="goal.exercise"
            :to="{ name: 'home', query: { tab: 'exercises', exercise: goal.exercise.slug } }"
            class="hover:underline"
          >
            {{ goalTitle(goal) }}
          </RouterLink>
          <template v-else>{{ goalTitle(goal) }}</template>
        </p>
        <p class="mt-0.5 text-[11px] text-zinc-500">{{ goalTiming(goal) }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <template v-if="goal.archivedAt === null">
          <button type="button" :class="iconButton" :disabled="busy" :aria-label="t('goals.edit')" @click="emit('edit')">
            <Pencil class="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" :class="iconButton" :disabled="busy" :aria-label="t('goals.archive')" @click="emit('archive')">
            <Archive class="h-4 w-4" aria-hidden="true" />
          </button>
        </template>
        <button v-else type="button" :class="iconButton" :disabled="busy" :aria-label="t('goals.restore')" @click="emit('restore')">
          <ArchiveRestore class="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" :class="iconButton" :disabled="busy" :aria-label="t('goals.delete')" @click="emit('remove')">
          <Trash2 class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5">
      <GoalProgressBar :percent="goal.progress.percent" :status="goal.progress.status" :label="t('goals.progressLabel', { goal: goalTitle(goal) })" />
      <p class="text-sm text-zinc-100 tabular-nums">
        {{ formatGoalValue(goal, goal.progress.current) }}
        <span class="text-zinc-500">/ {{ formatGoalValue(goal, goal.target) }}</span>
      </p>
      <GoalStatusLabel :status="goal.progress.status" />
      <p class="text-right text-[11px] text-zinc-500 tabular-nums">{{ goal.progress.percent.toFixed(0) }} %</p>
    </div>
  </li>
</template>
