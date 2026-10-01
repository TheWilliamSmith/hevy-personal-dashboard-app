<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';

import { passwordStrength } from '@/utils/auth';

const props = defineProps<{ password: string }>();

const LEVELS = [
  { key: '', bar: 'bg-zinc-800', text: 'text-zinc-500' },
  { key: 'auth.strength.tooShort', bar: 'bg-red-400', text: 'text-red-400' },
  { key: 'auth.strength.weak', bar: 'bg-amber-400', text: 'text-amber-400' },
  { key: 'auth.strength.good', bar: 'bg-blue-500', text: 'text-blue-400' },
  { key: 'auth.strength.strong', bar: 'bg-emerald-400', text: 'text-emerald-400' },
] as const;

const strength = computed(() => passwordStrength(props.password));
const level = computed(() => LEVELS[strength.value]);
</script>

<template>
  <div v-if="password" class="flex items-center gap-3" aria-live="polite">
    <div class="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
      <span
        v-for="step in 4"
        :key="step"
        class="h-1 rounded-full"
        :class="step <= strength ? level.bar : 'bg-zinc-800'"
      />
    </div>
    <span class="w-16 text-right text-[11px] font-medium" :class="level.text">{{ level.key ? t(level.key) : '' }}</span>
  </div>
</template>
