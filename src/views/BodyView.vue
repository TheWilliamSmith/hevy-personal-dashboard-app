<script setup lang="ts">
import { t } from '@/i18n';
import { CalendarDays, Layers, Repeat, Target, TrendingUp, Weight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import BalanceSpotlight from '@/components/body/BalanceSpotlight.vue';
import MuscleRanking, { type RankingEntry } from '@/components/body/MuscleRanking.vue';
import PeriodComparisonChart from '@/components/body/PeriodComparisonChart.vue';
import BodyHeatmap from '@/components/charts/BodyHeatmap.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import MetricGrid, { type MetricItem } from '@/components/ui/MetricGrid.vue';
import RangeSwitch from '@/components/ui/RangeSwitch.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useDashboardFilters, useMuscleHeatmap } from '@/composables/stats';
import { RANGE_PRESETS, type RangePreset } from '@/composables/stats/useDashboardFilters';
import { MUSCLE_LABELS, MUSCLE_ORDER } from '@/constants/muscles';
import type { HeatmapMetric, MuscleGroup } from '@/types/stats';
import { formatInteger, formatPercent, formatVolume, percentChange } from '@/utils/format';

type FigureView = 'both' | 'front' | 'back';

const metrics = computed<ReadonlyArray<SegmentedOption<HeatmapMetric>>>(() => [
  { value: 'sets', label: t('body.sets') },
  { value: 'volume', label: t('body.volume') },
  { value: 'reps', label: t('body.reps') },
]);

const views = computed<ReadonlyArray<SegmentedOption<FigureView>>>(() => [
  { value: 'both', label: t('body.both') },
  { value: 'front', label: t('body.front') },
  { value: 'back', label: t('body.back') },
]);

const MAPPED_MUSCLES = MUSCLE_ORDER.filter((muscle) => muscle !== 'CARDIO' && muscle !== 'FULL_BODY');

const router = useRouter();
const filters = useDashboardFilters();

const metric = ref<HeatmapMetric>('sets');
const includeSecondary = ref(true);
const view = ref<FigureView>('both');
const highlighted = ref<MuscleGroup | null>(null);

const preset = computed<RangePreset>(() =>
  filters.preset.value === 'custom' ? '30d' : filters.preset.value,
);

const rangeLabel = computed(() => {
  const found = RANGE_PRESETS.find((candidate) => candidate.value === preset.value);
  return found?.days ? t('ranges.last', { range: found.label }) : t('ranges.allTime');
});

const heatmap = useMuscleHeatmap(
  () => filters.range.value,
  () => metric.value,
  () => includeSecondary.value,
);

const data = computed(() => heatmap.data.value);
const metricLabel = computed(() => metrics.value.find((option) => option.value === metric.value)?.label ?? '');
const unit = computed(() =>
  metric.value === 'volume' ? 'kg' : metric.value === 'reps' ? t('body.unitReps') : t('body.unitSets'),
);
const isEmpty = computed(() => data.value !== null && data.value.max <= 0);

function format(value: number): string {
  return metric.value === 'volume' ? formatVolume(value) : formatInteger(value);
}

const total = computed(() =>
  data.value ? MUSCLE_ORDER.reduce((sum, muscle) => sum + (data.value?.values[muscle] ?? 0), 0) : null,
);

const entries = computed<RankingEntry[]>(() => {
  const payload = data.value;
  if (!payload) {
    return [];
  }
  return MUSCLE_ORDER.filter((muscle) => payload.values[muscle] > 0)
    .map((muscle) => ({
      muscleGroup: muscle,
      value: payload.values[muscle],
      share: payload.max > 0 ? Math.round((payload.values[muscle] / payload.max) * 100) : 0,
      change: percentChange(payload.values[muscle], payload.previous[muscle]),
    }))
    .sort((left, right) => right.value - left.value);
});

const biggestGain = computed(() =>
  entries.value
    .filter((entry) => entry.change !== null && entry.change > 0)
    .sort((left, right) => (right.change ?? 0) - (left.change ?? 0))[0] ?? null,
);

const weeklyAverage = computed(() => {
  const payload = data.value;
  if (!payload) {
    return null;
  }
  const trained = MAPPED_MUSCLES.filter((muscle) => payload.values[muscle] > 0);
  if (trained.length === 0) {
    return 0;
  }
  return trained.reduce((sum, muscle) => sum + payload.weeklyAverage[muscle], 0) / trained.length;
});

const comparedMuscles = computed(() => {
  const payload = data.value;
  if (!payload) {
    return [];
  }
  return MUSCLE_ORDER.filter((muscle) => payload.values[muscle] > 0 || payload.previous[muscle] > 0).sort(
    (left, right) => payload.values[right] - payload.values[left],
  );
});

const highlights = computed<MetricItem[]>(() => {
  const payload = data.value;
  return [
    {
      label: t('body.topMuscle'),
      value: payload?.topMuscle ? MUSCLE_LABELS[payload.topMuscle] : '—',
      icon: Target,
    },
    {
      label: t('body.totalOf', { metric: metricLabel.value.toLowerCase() }),
      value: total.value === null ? '—' : format(total.value),
      icon: metric.value === 'volume' ? Weight : metric.value === 'reps' ? Repeat : Layers,
    },
    {
      label: t('body.weeklyAvg'),
      value: weeklyAverage.value === null ? '—' : format(Math.round(weeklyAverage.value * 10) / 10),
      icon: CalendarDays,
    },
    {
      label: t('body.biggestGain'),
      value: biggestGain.value
        ? `${MUSCLE_LABELS[biggestGain.value.muscleGroup]} ${formatPercent(biggestGain.value.change)}`
        : '—',
      icon: TrendingUp,
    },
  ];
});

function openExercises(group: MuscleGroup): void {
  void router.push({ name: 'home', query: { tab: 'exercises', muscles: group } });
}
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <Teleport to="#topbar-actions" defer>
      <RangeSwitch :model-value="preset" @update:model-value="filters.setPreset" />
    </Teleport>

    <div class="flex flex-col gap-10 pt-6">
      <SectionError v-if="heatmap.error.value" :message="heatmap.error.value" @retry="heatmap.refresh" />

      <template v-else>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-0">
          <section class="flex flex-col gap-4 lg:pr-8" :aria-busy="heatmap.isLoading.value">
            <SectionHeader :title="t('body.muscleMap')" :subtitle="t('body.perMuscle', { metric: metricLabel, range: rangeLabel })">
              <SegmentedControl v-model="metric" :options="metrics" :label="t('body.metric')" />
            </SectionHeader>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <SegmentedControl v-model="view" :options="views" :label="t('body.figureView')" />
              <label class="flex items-center gap-2 text-xs text-zinc-400">
                <input v-model="includeSecondary" type="checkbox" class="h-3.5 w-3.5 accent-blue-600" />
                {{ t('body.countSecondary') }}
              </label>
            </div>

            <div class="relative h-[26rem] sm:h-[30rem]">
              <div v-if="heatmap.isLoading.value && !data" class="h-full animate-pulse rounded-md bg-zinc-900" />
              <EmptyState v-else-if="isEmpty" overlay import-link :message="t('body.noTraining')" />
              <BodyHeatmap
                v-else
                :values="data?.values ?? {}"
                :unit="unit"
                :view="view"
                :highlight="highlighted"
                :format="format"
                @select="openExercises"
              />
            </div>
          </section>

          <BalanceSpotlight
            class="border-zinc-800 lg:border-l lg:pl-8"
            :heatmap="data"
            :mapped-muscles="MAPPED_MUSCLES"
            :range-label="rangeLabel"
            :unit="unit"
            :format="format"
            :is-loading="heatmap.isLoading.value"
          />
        </div>

        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-0">
          <section class="flex flex-col gap-4 lg:pr-8">
            <SectionHeader :title="t('body.ranking')" :subtitle="t('body.rankingSubtitle', { metric: metricLabel })">
              <p class="text-right">
                <span class="text-2xl font-semibold text-white tabular-nums">
                  {{ total === null ? '—' : format(total) }}
                </span>
                <span class="block text-[11px] leading-tight text-zinc-500">{{ t('body.totalOf', { metric: metricLabel.toLowerCase() }) }}</span>
              </p>
            </SectionHeader>

            <ul v-if="heatmap.isLoading.value && !data" class="flex flex-col gap-4" aria-hidden="true">
              <li v-for="index in 8" :key="index" class="h-7 animate-pulse rounded bg-zinc-900" />
            </ul>
            <EmptyState v-else-if="entries.length === 0" :message="t('body.noMuscle')" />
            <MuscleRanking
              v-else
              :entries="entries"
              :highlighted="highlighted"
              :format="format"
              @highlight="highlighted = $event"
            />
          </section>

          <section class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:pl-8">
            <SectionHeader
              :title="t('body.comparison')"
              :subtitle="t('body.perMuscle', { metric: metricLabel, range: rangeLabel })"
            />
            <div class="relative h-[28rem] lg:h-auto lg:min-h-[20rem] lg:flex-1">
              <div v-if="heatmap.isLoading.value && !data" class="h-full animate-pulse rounded-md bg-zinc-900" />
              <EmptyState v-else-if="comparedMuscles.length === 0" overlay :message="t('body.nothingToCompare')" />
              <PeriodComparisonChart v-else-if="data" :heatmap="data" :muscles="comparedMuscles" :format="format" />
            </div>
          </section>
        </div>

        <section class="flex flex-col gap-5">
          <SectionHeader :title="t('body.highlights')" :subtitle="t('body.highlightsSubtitle', { metric: metricLabel, range: rangeLabel })" />
          <MetricGrid :items="highlights" :is-loading="heatmap.isLoading.value && !data" />
        </section>
      </template>
    </div>
  </div>
</template>
