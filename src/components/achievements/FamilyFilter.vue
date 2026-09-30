<script setup lang="ts">
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { FAMILY_LABELS } from '@/constants/achievements';
import type { AchievementFamily } from '@/types/achievements';

defineProps<{
  families: Array<{ family: AchievementFamily; total: number; unlocked: number }>;
  active: AchievementFamily | null;
}>();

const emit = defineEmits<{ select: [family: AchievementFamily | null] }>();
</script>

<template>
  <section class="flex flex-col gap-4">
    <SectionHeader title="Families" subtitle="Unlocked per family · click one to filter the trophies">
      <button
        v-if="active"
        type="button"
        class="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        @click="emit('select', null)"
      >
        Show all
      </button>
    </SectionHeader>

    <div class="grid grid-cols-2 gap-1 sm:grid-cols-4 xl:grid-cols-8" role="group" aria-label="Filter by family">
      <button
        v-for="entry in families"
        :key="entry.family"
        type="button"
        class="flex flex-col items-start gap-1 rounded-md px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :class="active === entry.family ? 'bg-zinc-800' : 'hover:bg-zinc-900'"
        :aria-pressed="active === entry.family"
        @click="emit('select', active === entry.family ? null : entry.family)"
      >
        <span class="text-lg font-semibold text-white tabular-nums">
          {{ entry.unlocked }}<span class="text-sm text-zinc-500"> / {{ entry.total }}</span>
        </span>
        <span class="text-xs text-zinc-400">{{ FAMILY_LABELS[entry.family] }}</span>
        <span class="mt-1 block h-1 w-full rounded-full bg-zinc-900">
          <span
            class="block h-full rounded-full bg-blue-500"
            :style="{ width: `${entry.total > 0 ? (entry.unlocked / entry.total) * 100 : 0}%` }"
          />
        </span>
      </button>
    </div>
  </section>
</template>
