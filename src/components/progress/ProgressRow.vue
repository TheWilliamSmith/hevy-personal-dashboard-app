<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import Sparkline from '@/components/charts/Sparkline.vue';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, MUSCLE_STYLES } from '@/constants/muscles';
import { LOW_WEEKLY_SETS, METRIC_LABELS, STATUS_STYLES } from '@/constants/progress';
import type { ProgressItem } from '@/types/progress';
import { formatDay } from '@/utils/format';
import {
  formatDaysAgo,
  formatGapToBest,
  formatMetricValue,
  formatSlope,
  formatWeeksAgo,
  gapToBestPct,
} from '@/utils/progress';

import MuteButton from './MuteButton.vue';

const props = defineProps<{ alert: ProgressItem; busy: boolean }>();

const emit = defineEmits<{ mute: [reason: string | null] }>();

const expanded = ref(false);

const style = computed(() => STATUS_STYLES[props.alert.status]);
const isNoData = computed(() => props.alert.status === 'NOT_ENOUGH_DATA');

const values = computed(() => props.alert.sessions.map((session) => session.value));
const prIndices = computed(() =>
  props.alert.sessions.flatMap((session, index) => (session.isPR ? [index] : [])),
);

const slopeClass = computed(() => {
  const slope = props.alert.slopePctPerWeek;
  if (slope === null || slope === 0) return 'text-zinc-500';
  return slope > 0 ? 'text-emerald-400' : 'text-red-400';
});

const lowVolume = computed(
  () =>
    props.alert.weeklySetsAvg < LOW_WEEKLY_SETS &&
    (props.alert.status === 'PLATEAU' || props.alert.status === 'REGRESSING'),
);

const weeklySets = computed(() =>
  props.alert.weeklySetsAvg.toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
);

const detailId = computed(() => `progress-detail-${props.alert.exerciseId}`);

const gap = computed(() => gapToBestPct(props.alert));

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const link = 'font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300';
const cell = 'px-3 py-1.5 text-xs';
</script>

<template>
  <li class="border-b border-zinc-800 last:border-b-0">
    <div
      class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 lg:grid-cols-[minmax(14rem,2fr)_7rem_minmax(9rem,1fr)_7rem_minmax(9rem,1fr)_auto]"
    >
      <div class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          class="shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-100"
          :class="focus"
          :aria-expanded="expanded"
          :aria-controls="detailId"
          :aria-label="`${expanded ? 'Hide' : 'Show'} sessions for ${alert.name}`"
          @click="expanded = !expanded"
        >
          <ChevronRight class="h-4 w-4 transition-transform" :class="{ 'rotate-90': expanded }" aria-hidden="true" />
        </button>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-zinc-100">{{ alert.name }}</span>
          <span class="flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">
            <span class="flex items-center gap-1" :class="style.text">
              <span class="h-1.5 w-1.5 rounded-full" :class="style.dot" aria-hidden="true" />
              {{ style.label }}
            </span>
            <span class="flex items-center gap-1">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :style="{ backgroundColor: MUSCLE_STYLES[alert.muscleGroup].hex }"
                aria-hidden="true"
              />
              {{ MUSCLE_LABELS[alert.muscleGroup] }}
            </span>
            <span>{{ EQUIPMENT_LABELS[alert.equipment] }}</span>
          </span>
        </span>
      </div>

      <Sparkline
        class="hidden lg:block"
        :points="values"
        :color="style.hex"
        :markers="prIndices"
        marker-stroke="#09090b"
        :width="104"
        :height="26"
        :label="`${METRIC_LABELS[alert.metricUsed]} over ${values.length} sessions, ${prIndices.length} personal records`"
      />

      <div class="hidden text-xs lg:block">
        <p class="text-zinc-100 tabular-nums">
          {{ formatMetricValue(alert.metricUsed, alert.current?.value) }}
          <span class="text-zinc-500">/ {{ formatMetricValue(alert.metricUsed, alert.best?.value) }}</span>
        </p>
        <p class="text-zinc-500">{{ formatGapToBest(gap) }}</p>
      </div>

      <p class="hidden text-xs font-medium tabular-nums lg:block" :class="isNoData ? 'text-zinc-500' : slopeClass">
        <template v-if="isNoData">needs more sessions</template>
        <template v-else>{{ formatSlope(alert.slopePctPerWeek) }}</template>
      </p>

      <div class="hidden text-xs text-zinc-400 lg:block">
        <p>Last PR: {{ alert.weeksSincePR === null ? 'none yet' : formatWeeksAgo(alert.weeksSincePR) }}</p>
        <p>Last done: {{ formatDaysAgo(alert.daysSinceLast) }}</p>
      </div>

      <div class="flex items-center justify-end gap-2">
        <RouterLink
          :to="{ name: 'home', query: { tab: 'exercises', exercise: alert.slug } }"
          class="rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
          :class="focus"
          :aria-label="`Open ${alert.name} in Exercises`"
        >
          Open
        </RouterLink>
        <MuteButton
          :exercise-id="alert.exerciseId"
          :exercise-name="alert.name"
          :muted="false"
          :busy="busy"
          @mute="(reason) => emit('mute', reason)"
        />
      </div>

      <p class="col-span-full pl-7 text-[11px]" :class="lowVolume ? 'text-amber-400' : 'text-zinc-500'">
        <template v-if="isNoData">
          Needs more sessions — {{ alert.sessionsAnalyzed }} in this window, 4 needed to assess.
        </template>
        <template v-else-if="lowVolume">
          {{ weeklySets }} sets/week — low volume: this may be a programming issue, not a plateau.
        </template>
        <template v-else>{{ weeklySets }} sets/week on average</template>
        <span class="lg:hidden">
          · {{ formatMetricValue(alert.metricUsed, alert.current?.value) }} ({{ formatGapToBest(gap) }})
          <template v-if="!isNoData">
            · <span class="whitespace-nowrap" :class="slopeClass">{{ formatSlope(alert.slopePctPerWeek) }}</span>
          </template>
          · <span class="whitespace-nowrap">last done {{ formatDaysAgo(alert.daysSinceLast) }}</span>
        </span>
      </p>
    </div>

    <div v-if="expanded" :id="detailId" class="mb-3 ml-7 rounded-md bg-zinc-900 px-4 py-3">
      <p class="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        <RouterLink
          v-if="alert.current"
          :to="{ name: 'home', query: { tab: 'workouts', workout: alert.current.workoutId } }"
          :class="link"
        >
          Latest session ({{ formatDay(alert.current.date) }})
        </RouterLink>
        <RouterLink
          v-if="alert.best"
          :to="{ name: 'home', query: { tab: 'workouts', workout: alert.best.workoutId } }"
          :class="link"
        >
          Best session ({{ formatDay(alert.best.date) }})
        </RouterLink>
        <span>{{ alert.avgSetsPerSession.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }} sets per session</span>
        <span>{{ alert.sessionsSinceImprovement }} sessions since the last improvement</span>
      </p>

      <table class="w-full max-w-md border-collapse">
        <caption class="sr-only">Sessions analysed for {{ alert.name }}</caption>
        <thead>
          <tr class="text-left text-[11px] font-medium text-zinc-500">
            <th scope="col" :class="cell">Date</th>
            <th scope="col" :class="cell">{{ METRIC_LABELS[alert.metricUsed] }}</th>
            <th scope="col" :class="cell">Record</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in [...alert.sessions].reverse()" :key="session.date" class="border-t border-zinc-800">
            <th scope="row" :class="[cell, 'text-left font-normal text-zinc-300']">{{ formatDay(session.date) }}</th>
            <td :class="[cell, 'text-zinc-100 tabular-nums']">{{ formatMetricValue(alert.metricUsed, session.value) }}</td>
            <td :class="cell">
              <span v-if="session.isPR" class="font-semibold text-emerald-400">PR</span>
              <span v-else class="text-zinc-600">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </li>
</template>
