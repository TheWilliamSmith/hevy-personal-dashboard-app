<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { computed } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import { FAMILY_LABELS, LADDER_LABELS, RARITY_STYLES } from '@/constants/achievements';
import type { AchievementFamily, AchievementItem } from '@/types/achievements';
import { formatProgress, ladderProgress, progressPercent } from '@/utils/achievements';

import AchievementIcon from './AchievementIcon.vue';
import LadderSteps from './LadderSteps.vue';

const props = defineProps<{
  ladder: { key: string; family: AchievementFamily; tiers: AchievementItem[] } | null;
}>();

const emit = defineEmits<{ close: [] }>();

const tiers = computed(() => props.ladder?.tiers ?? []);
const progress = computed(() => ladderProgress(tiers.value));
const next = computed(() => progress.value.current);
const top = computed(() => progress.value.top);
const title = computed(() =>
  props.ladder ? (LADDER_LABELS[props.ladder.key] ?? tiers.value[0]?.name ?? props.ladder.key) : '',
);
const percent = computed(() => (next.value ? progressPercent(next.value) : 100));
</script>

<template>
  <BaseDialog :open="ladder !== null" labelled-by="ladder-dialog-title" size="md" @close="emit('close')">
    <template v-if="ladder">
      <header class="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
          :class="top ? RARITY_STYLES[top.rarity].badge : 'bg-zinc-800 text-zinc-500'"
          aria-hidden="true"
        >
          <AchievementIcon :name="(top ?? tiers[0])?.icon ?? 'award'" :size="22" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 id="ladder-dialog-title" class="truncate text-base font-semibold text-white">{{ title }}</h2>
          <p class="text-xs text-zinc-500">
            {{ FAMILY_LABELS[ladder.family] }} · level {{ progress.unlockedCount }} of {{ tiers.length }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          aria-label="Close"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <section v-if="next" class="rounded-md border border-blue-500/40 bg-blue-500/10 p-4">
          <p class="text-[11px] font-medium tracking-wide text-blue-300 uppercase">Next step</p>
          <p class="mt-1 text-base font-semibold text-white">{{ next.name }}</p>
          <p class="text-sm text-zinc-300">Goal: {{ next.description }}</p>
          <div v-if="next.progress" class="mt-3">
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-medium text-zinc-100 tabular-nums">{{ formatProgress(next) }}</span>
              <span class="text-zinc-400 tabular-nums">{{ Math.floor(percent) }} %</span>
            </div>
            <div class="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                class="h-full rounded-full"
                :class="percent >= 75 ? 'bg-emerald-400' : 'bg-blue-500'"
                :style="{ width: `${percent}%` }"
              />
            </div>
          </div>
          <p class="mt-2 text-xs" :class="RARITY_STYLES[next.rarity].text">
            {{ RARITY_STYLES[next.rarity].label }} · {{ next.xp }} XP
          </p>
        </section>
        <p v-else class="rounded-md border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          Every level of this series is unlocked.
        </p>

        <h3 class="mt-5 mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">All steps</h3>
        <LadderSteps :tiers="tiers" />
      </div>
    </template>
  </BaseDialog>
</template>
