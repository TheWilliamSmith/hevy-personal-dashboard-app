<script setup lang="ts">
import { t } from '@/i18n';
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { MUSCLE_LABELS } from '@/constants/muscles';
import type { TrainingBalance } from '@/types/stats';
import { dateFormat, formatDecimal, formatInteger } from '@/utils/format';

const props = defineProps<{
  balance: TrainingBalance | null;
  isLoading: boolean;
  rangeLabel: string;
  neglectWeeks: number;
  minWorkouts: number;
}>();

const emit = defineEmits<{ 'update:neglectWeeks': [weeks: number]; 'update:minWorkouts': [count: number] }>();

const NEGLECT_OPTIONS = [2, 3, 4, 8] as const;
const WORKOUT_OPTIONS = [1, 2, 3, 4] as const;
const VISIBLE_NEGLECTED = 6;

const PATTERNS = [
  { key: 'push', color: 'bg-blue-500' },
  { key: 'pull', color: 'bg-emerald-500' },
  { key: 'legs', color: 'bg-amber-500' },
] as const;

const neglectOptions = computed<ReadonlyArray<SegmentedOption<string>>>(() =>
  NEGLECT_OPTIONS.map((count) => ({ value: String(count), label: t('body.program.weeksOption', { count }) })),
);
const workoutOptions = computed<ReadonlyArray<SegmentedOption<string>>>(() =>
  WORKOUT_OPTIONS.map((count) => ({ value: String(count), label: t('body.program.workoutsOption', { count }) })),
);

const split = computed(() => props.balance?.split ?? null);
const upperLowerTotal = computed(() => (split.value ? split.value.push + split.value.pull + split.value.legs : 0));

const segments = computed(() =>
  PATTERNS.map((pattern) => {
    const sets = split.value?.[pattern.key] ?? 0;
    const share = upperLowerTotal.value > 0 ? Math.round((sets / upperLowerTotal.value) * 100) : 0;
    return { ...pattern, sets, share, label: t(`body.program.${pattern.key}`) };
  }),
);

const splitLabel = computed(() => {
  const [push, pull, legs] = segments.value;
  return t('body.program.splitLabel', { push: push?.share ?? 0, pull: pull?.share ?? 0, legs: legs?.share ?? 0 });
});

const verdicts = computed(() => {
  const current = split.value;
  if (!current) {
    return [];
  }
  const lines = [{ ok: current.pushPullVerdict === 'BALANCED', text: t(`body.program.verdicts.${current.pushPullVerdict}`) }];
  if (current.upperLowerVerdict !== 'NOT_ENOUGH_DATA') {
    lines.push({ ok: current.upperLowerVerdict === 'BALANCED', text: t(`body.program.upperLower.${current.upperLowerVerdict}`) });
  }
  return lines;
});

const neglected = computed(() => props.balance?.neglected.muscles ?? []);
const visibleNeglected = computed(() => neglected.value.slice(0, VISIBLE_NEGLECTED));
const hiddenNeglected = computed(() => Math.max(0, neglected.value.length - VISIBLE_NEGLECTED));

const weeks = computed(() => props.balance?.consistency.weeks ?? []);
const busiestWeek = computed(() => Math.max(props.minWorkouts, ...weeks.value.map((week) => week.workouts)));

function weekLabel(weekStart: string, workouts: number): string {
  const date = dateFormat({ day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(weekStart));
  return t('body.program.weekBar', { date, count: workouts }, workouts);
}

function barHeight(workouts: number): string {
  return workouts === 0 ? '4px' : `${Math.max(12, Math.round((workouts / busiestWeek.value) * 100))}%`;
}
</script>

<template>
  <section class="flex flex-col gap-5" :aria-busy="isLoading">
    <SectionHeader :title="t('body.program.title')" :subtitle="t('body.program.subtitle', { range: rangeLabel.toLowerCase() })" />

    <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-3 lg:gap-0">
      <div class="flex flex-col gap-4 lg:pr-8">
        <div>
          <h3 class="text-xs font-medium text-zinc-300">{{ t('body.program.split') }}</h3>
          <p class="mt-0.5 text-xs text-zinc-500">{{ t('body.program.splitSubtitle') }}</p>
        </div>

        <div v-if="isLoading && !balance" class="h-24 animate-pulse rounded-md bg-zinc-900" />
        <template v-else-if="split">
          <p class="sr-only">{{ splitLabel }}</p>
          <div class="flex h-3 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
            <span
              v-for="segment in segments"
              :key="segment.key"
              :class="segment.color"
              :style="{ width: `${segment.share}%` }"
            />
          </div>

          <ul class="grid grid-cols-3 gap-2">
            <li v-for="segment in segments" :key="segment.key" class="flex flex-col gap-0.5">
              <span class="flex items-center gap-1.5 text-xs text-zinc-400">
                <span class="h-2 w-2 rounded-full" :class="segment.color" aria-hidden="true" />
                {{ segment.label }}
              </span>
              <span class="text-lg font-semibold text-white tabular-nums">{{ segment.share }}%</span>
              <span class="text-[11px] text-zinc-500 tabular-nums">{{ t('body.program.sets', { count: formatInteger(segment.sets) }, segment.sets) }}</span>
            </li>
          </ul>

          <p class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span v-if="split.pushPullRatio !== null">{{ t('body.program.pushPullRatio', { ratio: formatDecimal(split.pushPullRatio, 1) }) }}</span>
            <span v-if="split.lowerShare !== null">{{ t('body.program.lowerShare', { share: Math.round(split.lowerShare * 100) }) }}</span>
            <span v-if="split.core > 0">{{ t('body.program.core') }} · {{ t('body.program.sets', { count: formatInteger(split.core) }, split.core) }}</span>
          </p>

          <ul class="flex flex-col gap-2">
            <li v-for="verdict in verdicts" :key="verdict.text" class="flex items-start gap-2 text-sm text-zinc-300">
              <CheckCircle2 v-if="verdict.ok" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <AlertTriangle v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span>{{ verdict.text }}</span>
            </li>
          </ul>
        </template>
      </div>

      <div class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:px-8">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-xs font-medium text-zinc-300">{{ t('body.program.neglected') }}</h3>
            <p class="mt-0.5 text-xs text-zinc-500">{{ t('body.program.neglectedSubtitle', { weeks: neglectWeeks }) }}</p>
          </div>
          <SegmentedControl
            :model-value="String(neglectWeeks)"
            :options="neglectOptions"
            :label="t('body.program.neglectedWeeks')"
            @update:model-value="emit('update:neglectWeeks', Number($event))"
          />
        </div>

        <ul v-if="isLoading && !balance" class="flex flex-col gap-2" aria-hidden="true">
          <li v-for="index in 4" :key="index" class="h-8 animate-pulse rounded bg-zinc-900" />
        </ul>
        <p v-else-if="balance && neglected.length === 0" class="flex items-start gap-2 text-sm text-zinc-300">
          <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          {{ t('body.program.noneNeglected', { weeks: neglectWeeks }) }}
        </p>
        <ul v-else class="flex flex-col gap-1">
          <li v-for="muscle in visibleNeglected" :key="muscle.muscleGroup">
            <RouterLink
              :to="{ name: 'home', query: { tab: 'exercises', muscles: muscle.muscleGroup } }"
              class="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
            >
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :class="muscle.lastTrainedAt ? 'bg-amber-500' : 'bg-red-500'"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1 truncate text-zinc-200">{{ MUSCLE_LABELS[muscle.muscleGroup] }}</span>
              <span class="text-xs text-zinc-500">
                {{
                  muscle.weeksSince === null
                    ? t('body.program.neverTrained')
                    : t('body.program.weeksAgo', { count: muscle.weeksSince }, muscle.weeksSince)
                }}
              </span>
            </RouterLink>
          </li>
          <li v-if="hiddenNeglected > 0" class="px-2 pt-1 text-xs text-zinc-500">
            {{ t('body.program.moreNeglected', { count: hiddenNeglected }) }}
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:pl-8">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-xs font-medium text-zinc-300">{{ t('body.program.regularity') }}</h3>
            <p class="mt-0.5 text-xs text-zinc-500">{{ t('body.program.regularitySubtitle') }}</p>
          </div>
          <SegmentedControl
            :model-value="String(minWorkouts)"
            :options="workoutOptions"
            :label="t('body.program.minWorkouts')"
            @update:model-value="emit('update:minWorkouts', Number($event))"
          />
        </div>

        <div v-if="isLoading && !balance" class="h-28 animate-pulse rounded-md bg-zinc-900" />
        <template v-else-if="balance">
          <p>
            <span class="text-4xl font-semibold tracking-tight text-white tabular-nums">{{ balance.consistency.weeksMet }}</span>
            <span class="text-2xl text-zinc-500"> / {{ weeks.length }}</span>
            <span class="mt-1 block text-xs text-zinc-500">{{ t('body.program.weeksMet', { count: minWorkouts }, minWorkouts) }}</span>
          </p>

          <ol
            class="flex h-20 items-end gap-1"
            :aria-label="t('body.program.regularityLabel', { met: balance.consistency.weeksMet, count: minWorkouts })"
          >
            <li
              v-for="week in weeks"
              :key="week.weekStart"
              class="flex-1 rounded-sm"
              :class="week.workouts >= minWorkouts ? 'bg-blue-500' : week.workouts > 0 ? 'bg-slate-600' : 'bg-zinc-800'"
              :style="{ height: barHeight(week.workouts) }"
              :title="weekLabel(week.weekStart, week.workouts)"
            >
              <span class="sr-only">{{ weekLabel(week.weekStart, week.workouts) }}</span>
            </li>
          </ol>
        </template>
      </div>
    </div>
  </section>
</template>
