<script setup lang="ts">
import { FAMILY_LABELS, FAMILY_ORDER } from '@/constants/achievements';
import type { TrophyShow } from '@/composables/useAchievements';
import type { AchievementFamily } from '@/types/achievements';

const props = defineProps<{ family: AchievementFamily | null; show: TrophyShow }>();
const emit = defineEmits<{ family: [value: AchievementFamily | null]; show: [value: TrophyShow] }>();

const FAMILIES: ReadonlyArray<{ value: AchievementFamily | null; label: string }> = [
  { value: null, label: 'All' },
  ...FAMILY_ORDER.map((family) => ({ value: family, label: FAMILY_LABELS[family] })),
];

const SHOWS: ReadonlyArray<{ value: TrophyShow; label: string }> = [
  { value: 'all', label: 'Everything' },
  { value: 'unlocked', label: 'Unlocked only' },
  { value: 'locked', label: 'Locked only' },
  { value: 'progress', label: 'In progress' },
];
</script>

<template>
  <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
    <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label="Family">
      <button
        v-for="option in FAMILIES"
        :key="option.label"
        type="button"
        class="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
        :class="props.family === option.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'"
        :aria-pressed="props.family === option.value"
        @click="emit('family', option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200" role="group" aria-label="Show">
      <button
        v-for="option in SHOWS"
        :key="option.value"
        type="button"
        class="px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
        :class="props.show === option.value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'"
        :aria-pressed="props.show === option.value"
        @click="emit('show', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
