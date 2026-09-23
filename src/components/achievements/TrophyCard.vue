<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { NEGATIVE_STYLE, RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem } from '@/types/achievements';
import {
  describeAchievement,
  formatProgress,
  isInProgress,
  isNegative,
  progressPercent,
} from '@/utils/achievements';
import { formatDay } from '@/utils/format';

import AchievementIcon from './AchievementIcon.vue';

const props = defineProps<{
  item: AchievementItem;
  ladderSize: number;
  featured?: boolean;
}>();

const negative = computed(() => isNegative(props.item));
const unlocked = computed(() => props.item.unlocked);
const legendary = computed(() => unlocked.value && props.item.rarity === 'LEGENDARY' && !negative.value);
const started = computed(() => isInProgress(props.item));
const percent = computed(() => progressPercent(props.item));

const rarity = computed(() => RARITY_STYLES[props.item.rarity]);

const frame = computed(() => {
  if (negative.value) return NEGATIVE_STYLE.card;
  if (unlocked.value) return rarity.value.card;
  return started.value ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50';
});

const badge = computed(() => {
  if (negative.value) return NEGATIVE_STYLE.badge;
  return unlocked.value ? rarity.value.badge : 'bg-slate-100 text-slate-400';
});

const label = computed(() => describeAchievement(props.item));

const target = computed(() =>
  !props.featured && unlocked.value && props.item.workoutId
    ? { name: 'home' as const, query: { tab: 'workouts', workout: props.item.workoutId } }
    : null,
);
</script>

<template>
  <component
    :is="target ? RouterLink : 'article'"
    :to="target ?? undefined"
    :aria-current-value="target ? 'false' : undefined"
    class="trophy-tile relative flex h-full flex-col gap-2 overflow-hidden rounded-2xl border p-4 transition-shadow"
    :class="[
      frame,
      target ? 'hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' : '',
      legendary ? 'trophy-legendary' : '',
      props.featured ? 'p-6' : '',
    ]"
  >
    <span class="sr-only">{{ label }}</span>

    <div class="flex items-start gap-3" aria-hidden="true">
      <span
        class="flex shrink-0 items-center justify-center rounded-xl"
        :class="[badge, props.featured ? 'h-16 w-16' : 'h-11 w-11', unlocked ? '' : 'grayscale']"
      >
        <AchievementIcon :name="props.item.icon" :size="props.featured ? 32 : 22" />
      </span>

      <div class="min-w-0 flex-1">
        <p
          class="font-semibold leading-tight"
          :class="[props.featured ? 'text-lg' : 'text-sm', unlocked ? 'text-slate-900' : 'text-slate-600']"
        >
          {{ props.item.name }}
        </p>
        <p class="mt-0.5 text-[11px] font-medium" :class="negative ? NEGATIVE_STYLE.text : unlocked ? rarity.text : [rarity.text, 'opacity-60']">
          <template v-if="negative">{{ unlocked ? 'Heads-up' : 'Warning' }}</template>
          <template v-else>{{ rarity.label }} · {{ props.item.xp }} XP</template>
        </p>
      </div>
    </div>

    <div v-if="props.ladderSize > 1 && props.item.tier" class="flex gap-1" aria-hidden="true">
      <span
        v-for="rung in props.ladderSize"
        :key="rung"
        class="h-1.5 flex-1 rounded-full"
        :class="
          rung < props.item.tier
            ? 'bg-slate-300'
            : rung === props.item.tier
              ? unlocked ? 'bg-slate-800' : 'bg-slate-500'
              : 'bg-slate-100'
        "
      />
    </div>

    <div aria-hidden="true" class="flex flex-1 flex-col gap-2">
      <p v-if="unlocked && props.item.flavor" class="text-xs italic text-slate-600">
        “{{ props.item.flavor }}”
      </p>
      <p v-else class="text-xs text-slate-600">{{ props.item.description }}</p>

      <div v-if="!unlocked && props.item.progress" class="mt-auto">
        <div class="flex items-baseline justify-between gap-2 text-[11px]">
          <span class="font-medium tabular-nums" :class="started ? 'text-slate-800' : 'text-slate-400'">
            {{ formatProgress(props.item) }}
          </span>
          <span class="tabular-nums text-slate-400">{{ Math.floor(percent) }} %</span>
        </div>
        <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full"
            :class="negative ? 'bg-amber-400' : percent >= 75 ? 'bg-emerald-500' : 'bg-indigo-500'"
            :style="{ width: `${percent}%` }"
          />
        </div>
      </div>

      <p v-if="unlocked && props.item.unlockedAt" class="mt-auto text-[11px] text-slate-500">
        {{ negative ? 'Triggered' : 'Unlocked' }} {{ formatDay(props.item.unlockedAt) }}
        <span v-if="target" class="font-medium text-indigo-700"> · View workout</span>
      </p>
    </div>
  </component>
</template>

<style scoped>
.trophy-tile {
  content-visibility: auto;
  contain-intrinsic-size: auto 190px;
}

.trophy-legendary::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgb(255 255 255 / 0.55) 45%,
    rgb(251 191 36 / 0.25) 50%,
    transparent 65%
  );
  transform: translateX(-100%);
  animation: trophy-sheen 4.5s ease-in-out infinite;
}

@keyframes trophy-sheen {
  0%,
  60% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trophy-legendary::after {
    animation: none;
    display: none;
  }
}
</style>
