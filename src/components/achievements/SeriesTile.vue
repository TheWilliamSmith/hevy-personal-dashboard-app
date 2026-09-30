<script setup lang="ts">
import { Check, Layers } from 'lucide-vue-next';
import { computed } from 'vue';

import { LADDER_LABELS, RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem } from '@/types/achievements';
import { formatProgress, ladderProgress, progressPercent } from '@/utils/achievements';

import AchievementIcon from './AchievementIcon.vue';

const props = defineProps<{ ladderKey: string; tiers: AchievementItem[] }>();

const emit = defineEmits<{ open: [] }>();

const progress = computed(() => ladderProgress(props.tiers));
const title = computed(() => LADDER_LABELS[props.ladderKey] ?? props.tiers[0]?.name ?? props.ladderKey);
const next = computed(() => progress.value.current);
const top = computed(() => progress.value.top);
const complete = computed(() => next.value === null);
const percent = computed(() => (next.value ? progressPercent(next.value) : 100));

const frame = computed(() =>
  top.value ? RARITY_STYLES[top.value.rarity].card : 'border-zinc-800 bg-transparent',
);
</script>

<template>
  <button
    type="button"
    class="relative flex h-full w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
    :class="frame"
    :aria-label="`${title}, level ${progress.unlockedCount} of ${tiers.length}. Show every step`"
    @click="emit('open')"
  >
    <span
      v-if="complete"
      class="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-zinc-950"
      aria-hidden="true"
    >
      <Check class="h-3 w-3" :stroke-width="3" />
    </span>

    <span class="flex items-start gap-3" aria-hidden="true">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
        :class="top ? RARITY_STYLES[top.rarity].badge : 'bg-zinc-800 text-zinc-500'"
      >
        <AchievementIcon :name="(top ?? tiers[0])?.icon ?? 'award'" :size="22" />
      </span>
      <span class="min-w-0 flex-1 pr-5">
        <span class="block text-sm leading-tight font-semibold" :class="top ? 'text-zinc-100' : 'text-zinc-400'">
          {{ title }}
        </span>
        <span class="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
          <Layers class="h-3 w-3" />
          Level {{ progress.unlockedCount }} of {{ tiers.length }}
        </span>
      </span>
    </span>

    <span class="flex flex-1 flex-col gap-2" aria-hidden="true">
      <span v-if="next" class="text-xs text-zinc-400">
        <span class="text-zinc-500">Next:</span> <span class="font-medium text-zinc-200">{{ next.name }}</span>
        — {{ next.description }}
      </span>
      <span v-else class="text-xs text-emerald-400">Every level unlocked.</span>

      <span v-if="next?.progress" class="mt-auto block">
        <span class="flex items-baseline justify-between gap-2 text-[11px]">
          <span class="font-medium text-zinc-100 tabular-nums">{{ formatProgress(next) }}</span>
          <span class="text-zinc-500 tabular-nums">{{ Math.floor(percent) }} %</span>
        </span>
        <span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <span
            class="block h-full rounded-full"
            :class="percent >= 75 ? 'bg-emerald-400' : 'bg-blue-500'"
            :style="{ width: `${percent}%` }"
          />
        </span>
      </span>

      <span class="mt-auto text-[11px] font-medium text-zinc-300">View every step →</span>
    </span>
  </button>
</template>
