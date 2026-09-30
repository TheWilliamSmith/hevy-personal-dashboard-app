<script setup lang="ts">
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { MUSCLE_LABELS, MUSCLE_ORDER } from '@/constants/muscles';
import { SESSIONS_RANGE, STALE_RANGE, THRESHOLD_RANGE } from '@/constants/progress';
import type { MuscleGroup } from '@/types/exercises';
import type { ProgressParams, StatusCounts } from '@/types/progress';

defineProps<{
  draft: ProgressParams;
  counts: StatusCounts;
  total: number;
  isDefault: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{ change: [patch: Partial<ProgressParams>]; reset: [] }>();

const label = 'text-xs text-zinc-400';
const value = 'font-medium text-zinc-100';
const effect = 'mt-1 text-xs text-zinc-500 tabular-nums';
</script>

<template>
  <section id="progress-settings" class="flex flex-col gap-5">
    <SectionHeader title="Assessment settings" subtitle="How exercises are classified">
      <div class="flex items-center gap-3">
        <span v-if="isLoading" class="text-xs text-zinc-500" aria-live="polite">Updating…</span>
        <button
          v-if="!isDefault"
          type="button"
          class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          @click="emit('reset')"
        >
          Reset to defaults
        </button>
      </div>
    </SectionHeader>

    <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
      <div>
        <label for="progress-sessions" :class="label">
          Sessions analysed: <span :class="value">{{ draft.sessions }}</span>
        </label>
        <input
          id="progress-sessions"
          type="range"
          class="mt-2 w-full accent-blue-600"
          :min="SESSIONS_RANGE.min"
          :max="SESSIONS_RANGE.max"
          step="1"
          :value="draft.sessions"
          @input="emit('change', { sessions: Number(($event.target as HTMLInputElement).value) })"
        />
        <p :class="effect">{{ counts.NOT_ENOUGH_DATA }} need more sessions</p>
      </div>

      <div>
        <label for="progress-stale" :class="label">
          Stale after: <span :class="value">{{ draft.staleWeeks }} weeks</span>
        </label>
        <input
          id="progress-stale"
          type="range"
          class="mt-2 w-full accent-blue-600"
          :min="STALE_RANGE.min"
          :max="STALE_RANGE.max"
          step="1"
          :value="draft.staleWeeks"
          @input="emit('change', { staleWeeks: Number(($event.target as HTMLInputElement).value) })"
        />
        <p :class="effect">{{ counts.STALE }} stale</p>
      </div>

      <div>
        <label for="progress-threshold" :class="label">
          Progress threshold: <span :class="value">±{{ draft.threshold }} %/week</span>
        </label>
        <input
          id="progress-threshold"
          type="range"
          class="mt-2 w-full accent-blue-600"
          :min="THRESHOLD_RANGE.min"
          :max="THRESHOLD_RANGE.max"
          :step="THRESHOLD_RANGE.step"
          :value="draft.threshold"
          @input="emit('change', { threshold: Number(($event.target as HTMLInputElement).value) })"
        />
        <p :class="effect">
          {{ counts.PROGRESSING }} progressing · {{ counts.PLATEAU }} plateau ·
          {{ counts.REGRESSING }} regressing
        </p>
      </div>

      <div>
        <label for="progress-muscle" :class="label">Muscle group</label>
        <select
          id="progress-muscle"
          class="mt-1.5 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          :value="draft.muscleGroup ?? ''"
          @change="
            emit('change', {
              muscleGroup: (($event.target as HTMLSelectElement).value || null) as MuscleGroup | null,
            })
          "
        >
          <option value="">All muscle groups</option>
          <option v-for="group in MUSCLE_ORDER" :key="group" :value="group">
            {{ MUSCLE_LABELS[group] }}
          </option>
        </select>
        <p :class="effect">{{ total }} in scope</p>
      </div>
    </div>
  </section>
</template>
