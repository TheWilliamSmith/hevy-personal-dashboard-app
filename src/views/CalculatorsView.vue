<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import type { ExerciseCard, ExerciseCatalog } from '@/types/exercises';
import { estimateOneRepMax, percentageTable, PLATE_SETUPS, platesPerSide } from '@/utils/calculators';
import { formatDecimal, toDisplayWeight } from '@/utils/format';
import { weightUnit } from '@/utils/preferences';

const PLATE_COLORS: Readonly<Record<number, string>> = {
  25: 'bg-red-500',
  20: 'bg-blue-500',
  15: 'bg-amber-400',
  10: 'bg-emerald-500',
  5: 'bg-zinc-300',
  2.5: 'bg-zinc-500',
  1.25: 'bg-zinc-400',
  45: 'bg-blue-500',
  35: 'bg-amber-400',
};
const PLATE_HEIGHTS: Readonly<Record<number, number>> = { 25: 96, 20: 96, 15: 84, 10: 72, 5: 56, 2.5: 44, 1.25: 36, 45: 96, 35: 88 };

const route = useRoute();
const setup = computed(() => PLATE_SETUPS[weightUnit.value]);
const unit = computed(() => weightUnit.value);

function parse(value: string): number {
  const amount = Number(value.trim().replace(',', '.'));
  return Number.isFinite(amount) ? amount : Number.NaN;
}

function show(value: number, digits = 1): string {
  return `${formatDecimal(value, digits)} ${unit.value}`;
}

const liftWeight = ref('');
const liftReps = ref('5');
const estimate = computed(() => estimateOneRepMax(parse(liftWeight.value), parse(liftReps.value)));
const manyReps = computed(() => parse(liftReps.value) > 12);

const exercises = ref<ExerciseCard[]>([]);
const source = ref('');
const typedMax = ref('');

const strength = computed(() =>
  exercises.value.filter((exercise) => exercise.kind === 'STRENGTH' && exercise.best1RM !== null).sort((a, b) => a.name.localeCompare(b.name)),
);

const oneRepMax = computed(() => {
  const exercise = strength.value.find((item) => item.slug === source.value);
  if (exercise?.best1RM) {
    return toDisplayWeight(exercise.best1RM);
  }
  return parse(typedMax.value);
});
const rows = computed(() => percentageTable(oneRepMax.value, setup.value.increment));

function useEstimate(): void {
  if (estimate.value) {
    source.value = '';
    typedMax.value = formatDecimal(estimate.value, 1).replace(/\s/g, '');
  }
}

const target = ref('');
const bar = ref(String(PLATE_SETUPS[weightUnit.value].bars[0]));
const enabled = ref<number[]>([...PLATE_SETUPS[weightUnit.value].plates]);

watch(weightUnit, (next) => {
  bar.value = String(PLATE_SETUPS[next].bars[0]);
  enabled.value = [...PLATE_SETUPS[next].plates];
});

const bars = computed<ReadonlyArray<SegmentedOption<string>>>(() =>
  setup.value.bars.map((value) => ({ value: String(value), label: show(value, 2) })),
);

function togglePlate(plate: number): void {
  enabled.value = enabled.value.includes(plate) ? enabled.value.filter((item) => item !== plate) : [...enabled.value, plate];
}

const load = computed(() => (target.value.trim() ? platesPerSide(parse(target.value), Number(bar.value), enabled.value) : null));

function loadTarget(weight: number): void {
  target.value = String(weight);
}

onMounted(async () => {
  try {
    const catalog = await apiGet<ExerciseCatalog>('/exercises');
    exercises.value = catalog.groups.flatMap((group) => group.exercises);
    const wanted = typeof route.query.exercise === 'string' ? route.query.exercise : '';
    if (strength.value.some((exercise) => exercise.slug === wanted)) {
      source.value = wanted;
    }
  } catch {
    exercises.value = [];
  }
});

const label = 'mb-1 block text-xs text-zinc-400';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const field = `w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 ${focus}`;
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2 lg:gap-0">
        <section class="flex flex-col gap-5 lg:pr-8">
          <SectionHeader :title="t('calculators.oneRepMax.title')" :subtitle="t('calculators.oneRepMax.subtitle')" />
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="calc-weight" :class="label">{{ t('calculators.oneRepMax.weight', { unit }) }}</label>
              <input id="calc-weight" v-model="liftWeight" type="text" inputmode="decimal" placeholder="100" :class="field" />
            </div>
            <div>
              <label for="calc-reps" :class="label">{{ t('calculators.oneRepMax.reps') }}</label>
              <input id="calc-reps" v-model="liftReps" type="text" inputmode="numeric" placeholder="5" :class="field" />
            </div>
          </div>
          <div class="flex flex-wrap items-end justify-between gap-4">
            <p>
              <span class="block text-xs text-zinc-500">{{ t('calculators.oneRepMax.result') }}</span>
              <output for="calc-weight calc-reps" class="text-4xl font-semibold tracking-tight text-white tabular-nums">
                {{ estimate ? show(estimate) : '—' }}
              </output>
            </p>
            <button
              type="button"
              class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
              :class="focus"
              :disabled="!estimate"
              @click="useEstimate"
            >
              {{ t('calculators.oneRepMax.useForTable') }}
            </button>
          </div>
          <p class="text-xs text-zinc-500">{{ manyReps ? t('calculators.oneRepMax.manyReps') : t('calculators.oneRepMax.formula') }}</p>
        </section>

        <section class="flex flex-col gap-5 border-zinc-800 lg:border-l lg:pl-8">
          <SectionHeader :title="t('calculators.percentages.title')" :subtitle="t('calculators.percentages.subtitle')" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="calc-source" :class="label">{{ t('calculators.percentages.source') }}</label>
              <select id="calc-source" v-model="source" :class="field">
                <option value="">{{ t('calculators.percentages.typed') }}</option>
                <option v-for="exercise in strength" :key="exercise.slug" :value="exercise.slug">{{ exercise.name }}</option>
              </select>
            </div>
            <div>
              <label for="calc-max" :class="label">{{ t('calculators.percentages.oneRepMax', { unit }) }}</label>
              <input
                v-if="!source"
                id="calc-max"
                v-model="typedMax"
                type="text"
                inputmode="decimal"
                placeholder="140"
                :class="field"
              />
              <p v-else id="calc-max" class="py-2 text-sm font-medium text-zinc-100 tabular-nums">
                {{ t('calculators.percentages.best', { value: show(oneRepMax) }) }}
              </p>
            </div>
          </div>
          <p v-if="rows.length === 0" class="rounded-md border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
            {{ t('calculators.percentages.empty') }}
          </p>
          <table v-else class="w-full text-sm">
            <caption class="sr-only">{{ t('calculators.percentages.caption') }}</caption>
            <thead>
              <tr class="text-left text-xs text-zinc-500">
                <th scope="col" class="py-1.5 font-medium">%</th>
                <th scope="col" class="py-1.5 font-medium">{{ t('calculators.percentages.load') }}</th>
                <th scope="col" class="py-1.5 font-medium">{{ t('calculators.percentages.repsColumn') }}</th>
                <th scope="col" class="py-1.5"><span class="sr-only">{{ t('calculators.percentages.plates') }}</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
              <tr v-for="row in rows" :key="row.percent">
                <td class="py-1.5 text-zinc-400 tabular-nums">{{ row.percent }}%</td>
                <td class="py-1.5 font-medium text-zinc-100 tabular-nums">{{ show(row.weight, 2) }}</td>
                <td class="py-1.5 text-zinc-400 tabular-nums">{{ t('calculators.percentages.reps', { count: row.reps }, row.reps) }}</td>
                <td class="py-1.5 text-right">
                  <button
                    type="button"
                    class="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    :class="focus"
                    :aria-label="t('calculators.percentages.loadBar', { weight: show(row.weight, 2) })"
                    @click="loadTarget(row.weight)"
                  >
                    {{ t('calculators.percentages.plates') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <section class="flex flex-col gap-5 border-t border-zinc-800 pt-8">
        <SectionHeader :title="t('calculators.plates.title')" :subtitle="t('calculators.plates.subtitle')" />
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div class="flex flex-col gap-4">
            <div>
              <label for="calc-target" :class="label">{{ t('calculators.plates.target', { unit }) }}</label>
              <input id="calc-target" v-model="target" type="text" inputmode="decimal" placeholder="100" :class="field" />
            </div>
            <div class="flex flex-col gap-1">
              <span :class="label">{{ t('calculators.plates.bar') }}</span>
              <SegmentedControl v-model="bar" :options="bars" :label="t('calculators.plates.bar')" class="self-start" />
            </div>
            <fieldset>
              <legend :class="label">{{ t('calculators.plates.available') }}</legend>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="plate in setup.plates"
                  :key="plate"
                  type="button"
                  class="rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors"
                  :class="[
                    focus,
                    enabled.includes(plate) ? 'border-zinc-600 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 line-through',
                  ]"
                  :aria-pressed="enabled.includes(plate)"
                  @click="togglePlate(plate)"
                >
                  {{ show(plate, 2) }}
                </button>
              </div>
            </fieldset>
          </div>

          <div class="flex flex-col gap-4 rounded-md border border-zinc-800 p-5">
            <p v-if="!load" class="text-sm text-zinc-500">{{ t('calculators.plates.empty') }}</p>
            <template v-else>
              <p v-if="load.belowBar" class="text-sm text-amber-400">{{ t('calculators.plates.belowBar', { bar: show(Number(bar), 2) }) }}</p>
              <template v-else>
                <p class="text-sm text-zinc-400">
                  {{ t('calculators.plates.perSide') }}
                  <span class="font-medium text-zinc-100 tabular-nums">
                    {{ load.perSide.length ? load.perSide.map((plate) => formatDecimal(plate, 2)).join(' + ') : t('calculators.plates.emptyBar') }}
                  </span>
                </p>
                <div class="flex h-28 items-center" aria-hidden="true">
                  <span class="h-3 w-16 rounded-l bg-zinc-500" />
                  <span class="h-8 w-2 bg-zinc-400" />
                  <span
                    v-for="(plate, index) in load.perSide"
                    :key="index"
                    class="mx-px w-4 rounded-sm"
                    :class="PLATE_COLORS[plate] ?? 'bg-zinc-400'"
                    :style="{ height: `${PLATE_HEIGHTS[plate] ?? 40}px` }"
                  />
                  <span class="h-3 w-8 rounded-r bg-zinc-500" />
                </div>
                <p class="text-sm text-zinc-400">
                  {{ t('calculators.plates.total') }}
                  <span class="font-medium text-zinc-100 tabular-nums">{{ show(load.achieved, 2) }}</span>
                </p>
                <p v-if="load.remainder > 0" class="text-sm text-amber-400">
                  {{ t('calculators.plates.remainder', { value: show(load.remainder, 2) }) }}
                </p>
              </template>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
