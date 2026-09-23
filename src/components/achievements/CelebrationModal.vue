<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import { RARITY_STYLES } from '@/constants/achievements';
import { useCelebrations } from '@/composables/useCelebrations';
import { isNegative } from '@/utils/achievements';

import ConfettiBurst from './ConfettiBurst.vue';
import TrophyCard from './TrophyCard.vue';

/**
 * Rendered once, by the app shell. Shows the head of the unseen queue; "Nice"
 * marks it seen and advances, Escape or "Skip all" clears the rest.
 */
const { current, remaining, acknowledge, acknowledgeAll } = useCelebrations();

const open = computed(() => current.value !== null);
const negative = computed(() => (current.value ? isNegative(current.value) : false));

/** Not negotiable: no confetti and no scale animation when motion is reduced. */
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = ref(media.matches);
const onMotionChange = (event: MediaQueryListEvent): void => {
  reducedMotion.value = event.matches;
};
media.addEventListener('change', onMotionChange);
onBeforeUnmount(() => media.removeEventListener('change', onMotionChange));

/** The trophy's rarity leads the palette, with neutral accents. */
const confettiColors = computed(() =>
  current.value
    ? [RARITY_STYLES[current.value.rarity].hex, '#f59e0b', '#10b981', '#6366f1', '#ec4899']
    : [],
);
</script>

<template>
  <BaseDialog :open="open" labelled-by="celebration-title" @close="acknowledgeAll">
    <div v-if="current" class="relative overflow-hidden px-6 py-8 text-center">
      <!-- A negative achievement is a nudge: never confetti. -->
      <ConfettiBurst
        v-if="!reducedMotion && !negative"
        :key="current.code"
        :colors="confettiColors"
      />

      <p
        id="celebration-title"
        class="text-xs font-semibold tracking-wider uppercase"
        :class="negative ? 'text-amber-700' : 'text-indigo-600'"
      >
        {{ negative ? 'A little nudge' : 'Achievement unlocked' }}
      </p>

      <div
        :key="current.code"
        class="mx-auto mt-4 max-w-xs text-left"
        :class="reducedMotion ? '' : 'celebration-pop'"
      >
        <TrophyCard :item="current" :ladder-size="0" featured />
      </div>

      <p v-if="negative" class="mt-4 text-sm text-amber-800">
        Not a reward — a hint about what your training is skipping.
      </p>
      <p v-else class="mt-4 text-2xl font-bold text-slate-900">+{{ current.xp }} XP</p>

      <div class="mt-6 flex items-center justify-center gap-3">
        <button
          v-if="remaining > 1"
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          @click="acknowledgeAll"
        >
          Skip all ({{ remaining }})
        </button>
        <button
          type="button"
          data-autofocus
          class="rounded-lg px-5 py-2 text-sm font-semibold text-white"
          :class="negative ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'"
          @click="acknowledge"
        >
          {{ negative ? 'Noted' : 'Nice' }}<span v-if="remaining > 1" class="font-normal opacity-80"> · {{ remaining - 1 }} more</span>
        </button>
      </div>

      <p class="sr-only" aria-live="polite">
        {{ negative ? 'Warning' : 'Unlocked' }}: {{ current.name }}.
      </p>
    </div>
  </BaseDialog>
</template>

<style scoped>
.celebration-pop {
  animation: celebration-pop 520ms cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
}

@keyframes celebration-pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .celebration-pop {
    animation: none;
  }
}
</style>
