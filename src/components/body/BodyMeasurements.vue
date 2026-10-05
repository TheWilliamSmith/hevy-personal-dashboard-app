<script setup lang="ts">
import { t } from '@/i18n';
import type { EChartsOption } from 'echarts';
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import MeasurementDialog from '@/components/body/MeasurementDialog.vue';
import BaseChart from '@/components/dashboard/BaseChart.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { baseOption, categoryAxis, chartPalette, valueAxis } from '@/charts/theme';
import { useMeasurements } from '@/composables/useMeasurements';
import { useToasts } from '@/composables/useToasts';
import { ApiError } from '@/lib/api';
import type { Measurement, MeasurementField, MeasurementInput } from '@/types/measurements';
import { EMPTY, formatDay, formatDecimal, formatLoad, toDisplayWeight, weightUnitLabel } from '@/utils/format';
import { MEASUREMENT_FIELDS, summarize, withValue } from '@/utils/measurements';

const LINE_COLOR = '#3b82f6';
const RECENT = 5;

const measurements = useMeasurements();
const { push } = useToasts();

const field = ref<MeasurementField>('weightKg');
const dialogOpen = ref(false);
const editing = ref<Measurement | null>(null);
const deleting = ref<Measurement | null>(null);
const deleteError = ref<string | null>(null);
const isDeleting = ref(false);

const fields = computed<ReadonlyArray<SegmentedOption<MeasurementField>>>(() =>
  MEASUREMENT_FIELDS.map((value) => ({ value, label: t(`body.measurements.fields.${value}`) })),
);

const fieldLabel = computed(() => t(`body.measurements.fields.${field.value}`));
const unit = computed(() => (field.value === 'weightKg' ? weightUnitLabel() : 'cm'));

function display(value: number | null, name: MeasurementField = field.value): string {
  if (value === null) {
    return EMPTY;
  }
  return name === 'weightKg' ? formatLoad(value) : `${formatDecimal(value, 1)} cm`;
}

const points = computed(() => withValue(measurements.entries.value, field.value));
const summary = computed(() => summarize(measurements.entries.value, field.value));
const recent = computed(() => [...measurements.entries.value].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn)).slice(0, RECENT));

const change = computed(() => {
  const value = summary.value.change;
  if (value === null) {
    return null;
  }
  const shown = field.value === 'weightKg' ? toDisplayWeight(value) : value;
  return `${shown > 0 ? '+' : shown < 0 ? '−' : '±'}${formatDecimal(Math.abs(shown), 1)} ${unit.value}`;
});

const palette = computed(chartPalette);

const option = computed<EChartsOption>(() => ({
  ...baseOption(palette.value),
  grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
  tooltip: {
    ...baseOption(palette.value).tooltip,
    trigger: 'axis',
    formatter: (params: unknown) => {
      const index = (params as Array<{ dataIndex: number }>)[0]?.dataIndex ?? 0;
      const point = points.value[index];
      return point ? `<strong>${formatDay(point.measuredOn)}</strong><br/>${display(point[field.value])}` : '';
    },
  },
  xAxis: { ...categoryAxis(palette.value), axisLine: { show: false }, data: points.value.map((point) => formatDay(point.measuredOn)) },
  yAxis: { ...valueAxis(palette.value), scale: true, splitLine: { lineStyle: { color: palette.value.splitLine } } },
  series: [
    {
      name: fieldLabel.value,
      type: 'line',
      symbolSize: 6,
      lineStyle: { color: LINE_COLOR, width: 2 },
      itemStyle: { color: LINE_COLOR },
      data: points.value.map((point) => {
        const value = point[field.value] ?? 0;
        return field.value === 'weightKg' ? Math.round(toDisplayWeight(value) * 10) / 10 : value;
      }),
    },
  ],
}));

function openNew(): void {
  editing.value = null;
  dialogOpen.value = true;
}

function openEdit(entry: Measurement): void {
  editing.value = entry;
  dialogOpen.value = true;
}

async function save(input: MeasurementInput): Promise<void> {
  if (editing.value) {
    await measurements.update(editing.value.id, input);
    push({ tone: 'success', title: t('body.measurements.updated') });
  } else {
    await measurements.create(input);
    push({ tone: 'success', title: t('body.measurements.added') });
  }
}

async function confirmDelete(): Promise<void> {
  if (!deleting.value) {
    return;
  }
  isDeleting.value = true;
  deleteError.value = null;
  try {
    await measurements.remove(deleting.value.id);
    push({ tone: 'success', title: t('body.measurements.deleted') });
    deleting.value = null;
  } catch (error_) {
    deleteError.value = error_ instanceof ApiError ? error_.message : t('common.somethingWrong');
  } finally {
    isDeleting.value = false;
  }
}

function values(entry: Measurement): string {
  return MEASUREMENT_FIELDS.filter((name) => entry[name] !== null)
    .map((name) => `${t(`body.measurements.short.${name}`)} ${display(entry[name], name)}`)
    .join(' · ');
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <section class="flex flex-col gap-5" :aria-busy="measurements.isLoading.value">
    <SectionHeader :title="t('body.measurements.title')" :subtitle="t('body.measurements.subtitle')">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200"
        :class="focus"
        @click="openNew"
      >
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('body.measurements.add') }}
      </button>
    </SectionHeader>

    <SectionError v-if="measurements.error.value" :message="measurements.error.value" @retry="measurements.load" />

    <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-0">
      <div class="flex flex-col gap-4 lg:pr-8">
        <SegmentedControl v-model="field" :options="fields" :label="t('body.measurements.metric')" class="self-start" />

        <div class="flex flex-wrap items-end gap-x-8 gap-y-2">
          <p>
            <span class="block text-xs text-zinc-500">{{ t('body.measurements.latest', { field: fieldLabel.toLowerCase() }) }}</span>
            <span class="text-3xl font-semibold tracking-tight text-white tabular-nums">{{ display(summary.latest?.[field] ?? null) }}</span>
            <span v-if="summary.latest" class="ml-2 text-xs text-zinc-500">{{ formatDay(summary.latest.measuredOn) }}</span>
          </p>
          <p v-if="change">
            <span class="block text-xs text-zinc-500">{{ t('body.measurements.changeSince', { date: formatDay(summary.since) }) }}</span>
            <span class="text-lg font-semibold text-zinc-100 tabular-nums">{{ change }}</span>
          </p>
        </div>

        <div class="relative h-64">
          <div v-if="measurements.isLoading.value && measurements.entries.value.length === 0" class="h-full animate-pulse rounded-md bg-zinc-900" />
          <p
            v-else-if="points.length === 0"
            class="flex h-full items-center justify-center rounded-md border border-dashed border-zinc-800 px-6 text-center text-sm text-zinc-500"
          >
            {{ t('body.measurements.empty', { field: fieldLabel.toLowerCase() }) }}
          </p>
          <BaseChart v-else :option="option" />
        </div>
      </div>

      <div class="flex flex-col gap-3 border-zinc-800 lg:border-l lg:pl-8">
        <h3 class="text-xs font-medium text-zinc-300">{{ t('body.measurements.recent') }}</h3>
        <p v-if="!measurements.isLoading.value && recent.length === 0" class="text-sm text-zinc-500">{{ t('body.measurements.noEntry') }}</p>
        <ul class="flex flex-col divide-y divide-zinc-800">
          <li v-for="entry in recent" :key="entry.id" class="flex items-center gap-3 py-2.5">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-zinc-100">{{ formatDay(entry.measuredOn) }}</p>
              <p class="truncate text-xs text-zinc-500">{{ values(entry) }}</p>
            </div>
            <button
              type="button"
              class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              :class="focus"
              :aria-label="t('body.measurements.editEntry', { date: formatDay(entry.measuredOn) })"
              @click="openEdit(entry)"
            >
              <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-red-400"
              :class="focus"
              :aria-label="t('body.measurements.deleteEntry', { date: formatDay(entry.measuredOn) })"
              @click="deleting = entry"
            >
              <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>
    </div>

    <MeasurementDialog :open="dialogOpen" :entry="editing" :submit="save" @close="dialogOpen = false" />

    <ConfirmDialog
      :open="deleting !== null"
      labelled-by="measurement-delete-title"
      :title="t('body.measurements.deleteTitle')"
      :confirm-label="t('body.measurements.delete')"
      tone="danger"
      :is-busy="isDeleting"
      :error="deleteError"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    >
      {{ deleting ? t('body.measurements.deleteBody', { date: formatDay(deleting.measuredOn) }) : '' }}
    </ConfirmDialog>
  </section>
</template>
