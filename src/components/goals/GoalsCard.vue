<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import GoalProgressBar from '@/components/goals/GoalProgressBar.vue';
import GoalStatusLabel from '@/components/goals/GoalStatusLabel.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { Goal } from '@/types/goals';
import { formatGoalValue, goalTiming, goalTitle } from '@/utils/goals';

const props = defineProps<{ goals: readonly Goal[]; isLoading: boolean; error: string | null }>();
const emit = defineEmits<{ retry: [] }>();

const SHOWN = 3;
const shown = computed(() => props.goals.slice(0, SHOWN));
const manageLink = { name: 'home', query: { tab: 'goals' } };
</script>

<template>
  <section class="flex flex-col gap-5">
    <SectionHeader title="Goals" subtitle="Furthest behind first">
      <RouterLink
        :to="manageLink"
        class="rounded-md px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        {{ goals.length > SHOWN ? `All ${goals.length} goals` : 'Manage goals' }}
      </RouterLink>
    </SectionHeader>

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <div v-else-if="isLoading && goals.length === 0" class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      <div v-for="index in SHOWN" :key="index" class="flex flex-col gap-3">
        <div class="h-4 w-2/3 animate-pulse rounded bg-zinc-900" />
        <div class="h-8 w-1/3 animate-pulse rounded bg-zinc-900" />
        <div class="h-2 animate-pulse rounded-full bg-zinc-900" />
      </div>
    </div>

    <EmptyState v-else-if="goals.length === 0" message="No goal yet.">
      <RouterLink
        :to="manageLink"
        class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
      >
        Set your first goal
      </RouterLink>
    </EmptyState>

    <ul v-else class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="goal in shown" :key="goal.id" class="flex min-w-0 flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <p class="truncate text-sm font-medium text-zinc-100">{{ goalTitle(goal) }}</p>
          <GoalStatusLabel :status="goal.progress.status" class="shrink-0" />
        </div>
        <p class="text-2xl font-semibold text-white tabular-nums">
          {{ formatGoalValue(goal, goal.progress.current) }}
          <span class="text-sm font-normal text-zinc-500">/ {{ formatGoalValue(goal, goal.target) }}</span>
        </p>
        <GoalProgressBar :percent="goal.progress.percent" :status="goal.progress.status" :label="`${goalTitle(goal)} progress`" />
        <p class="text-xs text-zinc-500">{{ goalTiming(goal) }}</p>
      </li>
    </ul>
  </section>
</template>
