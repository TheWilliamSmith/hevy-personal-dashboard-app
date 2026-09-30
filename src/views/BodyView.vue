<script setup lang="ts">
import { Layers, PersonStanding, Repeat, Target, TrendingUp, Weight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import MuscleRanking, { type RankingEntry } from '@/components/body/MuscleRanking.vue';
import BodyHeatmap from '@/components/charts/BodyHeatmap.vue';
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

const METRICS: ReadonlyArray<SegmentedOption<HeatmapMetric>> = [
  { value: 'sets', label: 'Sets' },
  { value: 'volume', label: 'Volume' },
  { value: 'reps', label: 'Reps' },
];

const VIEWS: ReadonlyArray<SegmentedOption<FigureView>> = [
  { value: 'both', label: 'Both' },
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
];

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
  return found?.days ? `Last ${found.label}` : 'All time';
});

const heatmap = useMuscleHeatmap(
  () => filters.range.value,
  () => metric.value,
  () => includeSecondary.value,
);

const data = computed(() => heatmap.data.value);
const metricLabel = computed(() => METRICS.find((option) => option.value === metric.value)?.label ?? '');
const unit = computed(() => (metric.value === 'volume' ? 'kg' : metric.value));
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

const highlights = computed<MetricItem[]>(() => {
  const payload = data.value;
  const trained = payload ? MAPPED_MUSCLES.filter((muscle) => payload.values[muscle] > 0).length : null;
  return [
    {
      label: 'Top muscle',
      value: payload?.topMuscle ? MUSCLE_LABELS[payload.topMuscle] : '—',
      icon: Target,
    },
    {
      label: 'Muscles trained',
      value: trained === null ? '—' : `${trained} / ${MAPPED_MUSCLES.length}`,
      icon: PersonStanding,
    },
    {
      label: `Total ${metricLabel.value.toLowerCase()}`,
      value: total.value === null ? '—' : format(total.value),
      icon: metric.value === 'volume' ? Weight : metric.value === 'reps' ? Repeat : Layers,
    },
    {
      label: 'Biggest gain',
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
            <SectionHeader title="Muscle map" :subtitle="`${metricLabel} per muscle · ${rangeLabel}`">
              <SegmentedControl v-model="metric" :options="METRICS" label="Metric" />
            </SectionHeader>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <SegmentedControl v-model="view" :options="VIEWS" label="Figure view" />
              <label class="flex items-center gap-2 text-xs text-zinc-400">
                <input v-model="includeSecondary" type="checkbox" class="h-3.5 w-3.5 accent-blue-600" />
                Count secondary muscles
              </label>
            </div>

            <div class="h-[26rem] sm:h-[30rem]">
              <div v-if="heatmap.isLoading.value && !data" class="h-full animate-pulse rounded-md bg-zinc-900" />
              <div v-else-if="isEmpty" class="flex h-full flex-col items-center justify-center gap-2">
                <p class="text-sm text-zinc-500">No training in this period.</p>
                <RouterLink
                  :to="{ name: 'home', query: { tab: 'data' } }"
                  class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2"
                >
                  Connect Hevy or import a CSV export
                </RouterLink>
              </div>
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

          <section class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:pl-8">
            <SectionHeader title="Ranking" subtitle="Change vs the previous period">
              <p class="text-right">
                <span class="text-2xl font-semibold text-white tabular-nums">
                  {{ total === null ? '—' : format(total) }}
                </span>
                <span class="block text-[11px] leading-tight text-zinc-500">Total {{ metricLabel.toLowerCase() }}</span>
              </p>
            </SectionHeader>

            <ul v-if="heatmap.isLoading.value && !data" class="flex flex-col gap-4" aria-hidden="true">
              <li v-for="index in 8" :key="index" class="h-7 animate-pulse rounded bg-zinc-900" />
            </ul>
            <p v-else-if="entries.length === 0" class="text-sm text-zinc-500">No muscle trained in this period.</p>
            <MuscleRanking
              v-else
              :entries="entries"
              :least-trained="data?.leastTrained ?? []"
              :highlighted="highlighted"
              :format="format"
              @highlight="highlighted = $event"
            />
          </section>
        </div>

        <section class="flex flex-col gap-5">
          <SectionHeader title="Highlights" :subtitle="`${metricLabel} · ${rangeLabel}`" />
          <MetricGrid :items="highlights" :is-loading="heatmap.isLoading.value && !data" />
        </section>
      </template>
    </div>
  </div>
</template>
