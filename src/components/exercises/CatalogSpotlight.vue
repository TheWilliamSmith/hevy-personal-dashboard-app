<script setup lang="ts">
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { ExerciseListTotals } from '@/types/exercises';
import { formatInteger } from '@/utils/format';

defineProps<{
  totals: ExerciseListTotals | null;
  customCount: number;
  isLoading: boolean;
}>();
</script>

<template>
  <section class="flex h-full flex-col gap-4">
    <SectionHeader title="Catalog" subtitle="Exercises you have performed at least once" />

    <div>
      <p
        class="text-5xl font-semibold tracking-tight text-white tabular-nums"
        :class="{ 'animate-pulse text-zinc-700': isLoading && !totals }"
      >
        {{ formatInteger(totals?.performed ?? 0) }}<span class="text-3xl text-zinc-500"> / {{ formatInteger(totals?.exercises ?? 0) }}</span>
      </p>
      <p class="mt-2 max-w-xs text-sm text-zinc-400">
        <template v-if="totals">
          {{ formatInteger(totals.performed) }} exercises performed,
          {{ formatInteger(totals.neverPerformed) }} still waiting for a first session.
        </template>
        <template v-else>Loading the catalog…</template>
      </p>
    </div>

    <dl v-if="totals" class="mt-auto flex gap-8">
      <div class="flex flex-col-reverse">
        <dt class="text-xs text-zinc-500">Never performed</dt>
        <dd class="text-2xl font-semibold text-white tabular-nums">{{ formatInteger(totals.neverPerformed) }}</dd>
      </div>
      <div class="flex flex-col-reverse">
        <dt class="text-xs text-zinc-500">Custom (listed)</dt>
        <dd class="text-2xl font-semibold text-white tabular-nums">{{ formatInteger(customCount) }}</dd>
      </div>
    </dl>
  </section>
</template>
