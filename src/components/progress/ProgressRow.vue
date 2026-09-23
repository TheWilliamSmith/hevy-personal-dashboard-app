<script setup lang="ts">
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
  if (slope === null || slope === 0) return 'text-slate-500';
  return slope > 0 ? 'text-emerald-600' : 'text-red-600';
});

/**
 * A stall at under two sets a week says more about the programme than about
 * the lifter, so it gets a different hint rather than the plain average.
 */
const lowVolume = computed(
  () =>
    props.alert.weeklySetsAvg < LOW_WEEKLY_SETS &&
    // Only where "stalled" is the claim. A STALE exercise was simply dropped;
    // telling it "not a plateau" answers a question nobody asked.
    (props.alert.status === 'PLATEAU' || props.alert.status === 'REGRESSING'),
);

const weeklySets = computed(() =>
  props.alert.weeklySetsAvg.toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
);

const detailId = computed(() => `progress-detail-${props.alert.exerciseId}`);

const gap = computed(() => gapToBestPct(props.alert));

const cell = 'px-3 py-1.5 text-xs';
</script>

<template>
  <li class="border-b border-slate-100 last:border-b-0" :class="isNoData ? 'bg-slate-50/60' : 'bg-white'">
    <div class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-2.5 lg:grid-cols-[minmax(14rem,2fr)_7rem_minmax(9rem,1fr)_7rem_minmax(9rem,1fr)_auto]">
      <!-- Identity -->
      <div class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          class="shrink-0 text-xs text-slate-400 hover:text-slate-700"
          :aria-expanded="expanded"
          :aria-controls="detailId"
          :aria-label="`${expanded ? 'Hide' : 'Show'} sessions for ${props.alert.name}`"
          @click="expanded = !expanded"
        >
          {{ expanded ? '▾' : '▸' }}
        </button>
        <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="style.pill">
          {{ style.label }}
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-slate-900">{{ props.alert.name }}</span>
          <span class="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
            <span class="rounded-full px-1.5 ring-1 ring-inset" :class="MUSCLE_STYLES[props.alert.muscleGroup].chip">
              {{ MUSCLE_LABELS[props.alert.muscleGroup] }}
            </span>
            {{ EQUIPMENT_LABELS[props.alert.equipment] }}
          </span>
        </span>
      </div>

      <!-- Sparkline of the analysed sessions, PRs marked -->
      <Sparkline
        class="hidden lg:block"
        :points="values"
        :color="style.hex"
        :markers="prIndices"
        :width="104"
        :height="26"
        :label="`${METRIC_LABELS[props.alert.metricUsed]} over ${values.length} sessions, ${prIndices.length} personal records`"
      />

      <!-- Current vs best -->
      <div class="hidden text-xs lg:block">
        <p class="tabular-nums text-slate-900">
          {{ formatMetricValue(props.alert.metricUsed, props.alert.current?.value) }}
          <span class="text-slate-400">/ {{ formatMetricValue(props.alert.metricUsed, props.alert.best?.value) }}</span>
        </p>
        <p class="text-slate-500">{{ formatGapToBest(gap) }}</p>
      </div>

      <!-- Slope -->
      <p class="hidden text-xs font-medium tabular-nums lg:block" :class="slopeClass">
        <template v-if="isNoData">needs more sessions</template>
        <template v-else>{{ formatSlope(props.alert.slopePctPerWeek) }}</template>
      </p>

      <!-- Recency -->
      <div class="hidden text-xs text-slate-600 lg:block">
        <p>Last PR: {{ props.alert.weeksSincePR === null ? 'none yet' : formatWeeksAgo(props.alert.weeksSincePR) }}</p>
        <p>Last done: {{ formatDaysAgo(props.alert.daysSinceLast) }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2">
        <RouterLink
          :to="{ name: 'home', query: { tab: 'exercises', exercise: props.alert.slug } }"
          aria-current-value="false"
          class="rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          :aria-label="`Open ${props.alert.name} in Exercises`"
        >
          Open
        </RouterLink>
        <MuteButton
          :exercise-id="props.alert.exerciseId"
          :exercise-name="props.alert.name"
          :muted="false"
          :busy="props.busy"
          @mute="(reason) => emit('mute', reason)"
        />
      </div>

      <!-- Context line, muted -->
      <p class="col-span-full pl-7 text-[11px]" :class="lowVolume ? 'text-amber-700' : 'text-slate-400'">
        <template v-if="isNoData">
          Needs more sessions — {{ props.alert.sessionsAnalyzed }} in this window, 4 needed to assess.
        </template>
        <template v-else-if="lowVolume">
          {{ weeklySets }} sets/week — low volume: this may be a programming issue, not a plateau.
        </template>
        <template v-else>{{ weeklySets }} sets/week on average</template>
        <!-- The four desktop-only columns, condensed for narrow screens. -->
        <span class="lg:hidden">
          · {{ formatMetricValue(props.alert.metricUsed, props.alert.current?.value) }}
          ({{ formatGapToBest(gap) }})
          <template v-if="!isNoData">· <span class="whitespace-nowrap" :class="slopeClass">{{ formatSlope(props.alert.slopePctPerWeek) }}</span></template>
          · <span class="whitespace-nowrap">last done {{ formatDaysAgo(props.alert.daysSinceLast) }}</span>
        </span>
      </p>
    </div>

    <div v-if="expanded" :id="detailId" class="border-t border-slate-100 bg-slate-50 px-4 py-3 pl-11">
      <p class="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <RouterLink
          v-if="props.alert.current"
          :to="{ name: 'home', query: { tab: 'workouts', workout: props.alert.current.workoutId } }"
          aria-current-value="false"
          class="font-medium text-indigo-700 underline underline-offset-2"
        >
          Latest session ({{ formatDay(props.alert.current.date) }})
        </RouterLink>
        <RouterLink
          v-if="props.alert.best"
          :to="{ name: 'home', query: { tab: 'workouts', workout: props.alert.best.workoutId } }"
          aria-current-value="false"
          class="font-medium text-indigo-700 underline underline-offset-2"
        >
          Best session ({{ formatDay(props.alert.best.date) }})
        </RouterLink>
        <span>{{ props.alert.avgSetsPerSession.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }} sets per session</span>
        <span>{{ props.alert.sessionsSinceImprovement }} sessions since the last improvement</span>
      </p>

      <table class="w-full max-w-md border-collapse">
        <caption class="sr-only">Sessions analysed for {{ props.alert.name }}</caption>
        <thead>
          <tr class="text-left text-[11px] font-semibold text-slate-600">
            <th scope="col" :class="cell">Date</th>
            <th scope="col" :class="cell">{{ METRIC_LABELS[props.alert.metricUsed] }}</th>
            <th scope="col" :class="cell">Record</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in [...props.alert.sessions].reverse()" :key="session.date" class="border-t border-slate-200">
            <th scope="row" :class="[cell, 'text-left font-normal text-slate-700']">{{ formatDay(session.date) }}</th>
            <td :class="[cell, 'tabular-nums text-slate-900']">{{ formatMetricValue(props.alert.metricUsed, session.value) }}</td>
            <td :class="cell">
              <span v-if="session.isPR" class="font-semibold text-emerald-700">PR</span>
              <span v-else class="text-slate-300">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </li>
</template>
