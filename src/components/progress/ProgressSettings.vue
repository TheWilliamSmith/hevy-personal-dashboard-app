<script setup lang="ts">
import { ref } from 'vue';

import { MUSCLE_LABELS, MUSCLE_ORDER } from '@/constants/muscles';
import { SESSIONS_RANGE, STALE_RANGE, THRESHOLD_RANGE, WINDOWS } from '@/constants/progress';
import type { MuscleGroup } from '@/types/exercises';
import type { ProgressParams, ProgressWindow, StatusCounts } from '@/types/progress';

const props = defineProps<{
  draft: ProgressParams;
  counts: StatusCounts;
  total: number;
  isDefault: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{ change: [patch: Partial<ProgressParams>]; reset: [] }>();

const open = ref(false);

const label = 'text-xs font-medium text-slate-600';
const effect = 'text-xs tabular-nums text-slate-500';
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white">
    <div class="flex flex-wrap items-center gap-3 px-4 py-2.5">
      <button
        type="button"
        class="flex items-center gap-2 text-sm font-medium text-slate-800"
        :aria-expanded="open"
        aria-controls="progress-settings"
        @click="open = !open"
      >
        <span aria-hidden="true" class="text-xs text-slate-400">{{ open ? '▾' : '▸' }}</span>
        Settings
      </button>

      <p class="text-xs text-slate-500">
        {{ WINDOWS.find((item) => item.value === props.draft.window)?.label }}
        · {{ props.draft.sessions }} sessions · stale after {{ props.draft.staleWeeks }} weeks ·
        ±{{ props.draft.threshold }} %/week
        <template v-if="props.draft.muscleGroup">
          · {{ MUSCLE_LABELS[props.draft.muscleGroup] }}
        </template>
      </p>

      <span v-if="props.isLoading" class="text-xs text-slate-400" aria-live="polite">Updating…</span>

      <button
        v-if="!props.isDefault"
        type="button"
        class="ml-auto text-xs font-medium text-indigo-700 underline underline-offset-2"
        @click="emit('reset')"
      >
        Reset to defaults
      </button>
    </div>

    <div
      v-if="open"
      id="progress-settings"
      class="grid gap-x-6 gap-y-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <div>
        <label for="progress-window" :class="label">Window</label>
        <select
          id="progress-window"
          class="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          :value="props.draft.window"
          @change="emit('change', { window: ($event.target as HTMLSelectElement).value as ProgressWindow })"
        >
          <option v-for="item in WINDOWS" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <p :class="effect">{{ props.total }} exercises assessed</p>
      </div>

      <div>
        <label for="progress-sessions" :class="label">
          Sessions analysed: <strong class="text-slate-900">{{ props.draft.sessions }}</strong>
        </label>
        <input
          id="progress-sessions"
          type="range"
          class="mt-2 w-full"
          :min="SESSIONS_RANGE.min"
          :max="SESSIONS_RANGE.max"
          step="1"
          :value="props.draft.sessions"
          @input="emit('change', { sessions: Number(($event.target as HTMLInputElement).value) })"
        />
        <p :class="effect">{{ props.counts.NOT_ENOUGH_DATA }} need more sessions</p>
      </div>

      <div>
        <label for="progress-stale" :class="label">
          Stale after: <strong class="text-slate-900">{{ props.draft.staleWeeks }} weeks</strong>
        </label>
        <input
          id="progress-stale"
          type="range"
          class="mt-2 w-full"
          :min="STALE_RANGE.min"
          :max="STALE_RANGE.max"
          step="1"
          :value="props.draft.staleWeeks"
          @input="emit('change', { staleWeeks: Number(($event.target as HTMLInputElement).value) })"
        />
        <p :class="effect">{{ props.counts.STALE }} stale</p>
      </div>

      <div>
        <label for="progress-threshold" :class="label">
          Progress threshold:
          <strong class="text-slate-900">±{{ props.draft.threshold }} %/week</strong>
        </label>
        <input
          id="progress-threshold"
          type="range"
          class="mt-2 w-full"
          :min="THRESHOLD_RANGE.min"
          :max="THRESHOLD_RANGE.max"
          :step="THRESHOLD_RANGE.step"
          :value="props.draft.threshold"
          @input="
            emit('change', {
              threshold: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
        <p :class="effect">
          {{ props.counts.PROGRESSING }} progressing · {{ props.counts.PLATEAU }} plateau ·
          {{ props.counts.REGRESSING }} regressing
        </p>
      </div>

      <div>
        <label for="progress-muscle" :class="label">Muscle group</label>
        <select
          id="progress-muscle"
          class="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          :value="props.draft.muscleGroup ?? ''"
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
        <p :class="effect">{{ props.total }} in scope</p>
      </div>
    </div>
  </section>
</template>
