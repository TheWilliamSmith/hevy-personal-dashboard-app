<script setup lang="ts">
import { t } from '@/i18n';
import { reactive, ref, watch } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import { ApiError } from '@/lib/api';
import type { Measurement, MeasurementField, MeasurementInput } from '@/types/measurements';
import { fromDisplayWeight, toDisplayWeight, weightUnitLabel } from '@/utils/format';
import { todayKey } from '@/utils/goals';

const props = defineProps<{
  open: boolean;
  entry: Measurement | null;
  submit: (input: MeasurementInput) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();

const CM_FIELDS = ['armCm', 'waistCm', 'thighCm', 'chestCm'] as const;

const form = reactive<Record<'measuredOn' | MeasurementField, string>>({
  measuredOn: todayKey(),
  weightKg: '',
  armCm: '',
  waistCm: '',
  thighCm: '',
  chestCm: '',
});
const fieldErrors = reactive<Record<string, string | null>>({ measuredOn: null, weightKg: null, armCm: null, waistCm: null, thighCm: null, chestCm: null });
const formError = ref<string | null>(null);
const isSaving = ref(false);

function shown(value: number | null, weight: boolean): string {
  if (value === null) {
    return '';
  }
  return String(weight ? Math.round(toDisplayWeight(value) * 10) / 10 : value);
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const entry = props.entry;
    Object.assign(fieldErrors, { measuredOn: null, weightKg: null, armCm: null, waistCm: null, thighCm: null, chestCm: null });
    formError.value = null;
    Object.assign(form, {
      measuredOn: entry?.measuredOn ?? todayKey(),
      weightKg: shown(entry?.weightKg ?? null, true),
      armCm: shown(entry?.armCm ?? null, false),
      waistCm: shown(entry?.waistCm ?? null, false),
      thighCm: shown(entry?.thighCm ?? null, false),
      chestCm: shown(entry?.chestCm ?? null, false),
    });
  },
  { immediate: true },
);

function parse(field: MeasurementField): number | null | undefined {
  const raw = form[field].trim().replace(',', '.');
  if (raw === '') {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    fieldErrors[field] = t('body.measurements.invalidNumber');
    return undefined;
  }
  const kg = field === 'weightKg' ? fromDisplayWeight(value) : value;
  return Math.round(kg * 10) / 10;
}

function collect(): MeasurementInput | null {
  Object.assign(fieldErrors, { measuredOn: null, weightKg: null, armCm: null, waistCm: null, thighCm: null, chestCm: null });
  const values: MeasurementInput = { measuredOn: form.measuredOn };
  for (const field of ['weightKg', ...CM_FIELDS] as const) {
    const value = parse(field);
    if (value !== undefined) {
      values[field] = value;
    }
  }
  if (!form.measuredOn) {
    fieldErrors.measuredOn = t('body.measurements.chooseDate');
  }
  if (Object.values(fieldErrors).some(Boolean)) {
    return null;
  }
  if (['weightKg', ...CM_FIELDS].every((field) => values[field as MeasurementField] === null)) {
    formError.value = t('body.measurements.needsValue');
    return null;
  }
  return values;
}

async function onSubmit(): Promise<void> {
  formError.value = null;
  const values = collect();
  if (!values) {
    return;
  }
  isSaving.value = true;
  try {
    await props.submit(values);
    emit('close');
  } catch (error_) {
    if (error_ instanceof ApiError) {
      const { field } = (error_.body ?? {}) as { field?: unknown };
      if (typeof field === 'string' && field in fieldErrors) {
        fieldErrors[field] = error_.message;
      } else {
        formError.value = error_.message;
      }
    } else {
      formError.value = t('common.somethingWrong');
    }
  } finally {
    isSaving.value = false;
  }
}

const label = 'mb-1 block text-xs text-zinc-400';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const field = `w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 ${focus}`;
const errorText = 'mt-1 text-xs text-red-400';
</script>

<template>
  <BaseDialog :open="open" labelled-by="measurement-form-title" size="md" :locked="isSaving" @close="emit('close')">
    <form class="flex min-h-0 flex-1 flex-col" novalidate @submit.prevent="onSubmit">
      <header class="border-b border-zinc-800 px-5 py-4">
        <h2 id="measurement-form-title" class="text-base font-semibold text-white">
          {{ entry ? t('body.measurements.editTitle') : t('body.measurements.newTitle') }}
        </h2>
        <p class="mt-0.5 text-xs text-zinc-500">{{ t('body.measurements.formHint') }}</p>
      </header>

      <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="measurement-date" :class="label">{{ t('body.measurements.date') }}</label>
            <input
              id="measurement-date"
              v-model="form.measuredOn"
              type="date"
              :max="todayKey()"
              :class="field"
              :aria-invalid="Boolean(fieldErrors.measuredOn)"
              aria-describedby="measurement-date-help"
            />
            <p id="measurement-date-help" :class="errorText">{{ fieldErrors.measuredOn ?? '' }}</p>
          </div>
          <div>
            <label for="measurement-weightKg" :class="label">{{ t('body.measurements.weightWithUnit', { unit: weightUnitLabel() }) }}</label>
            <input
              id="measurement-weightKg"
              v-model="form.weightKg"
              type="text"
              inputmode="decimal"
              :class="field"
              :aria-invalid="Boolean(fieldErrors.weightKg)"
              aria-describedby="measurement-weightKg-help"
            />
            <p id="measurement-weightKg-help" :class="errorText">{{ fieldErrors.weightKg ?? '' }}</p>
          </div>
        </div>

        <fieldset class="grid grid-cols-2 gap-4">
          <legend class="mb-2 text-xs font-medium text-zinc-300">{{ t('body.measurements.circumferences') }}</legend>
          <div v-for="name in CM_FIELDS" :key="name">
            <label :for="`measurement-${name}`" :class="label">{{ t(`body.measurements.fields.${name}`) }} (cm)</label>
            <input
              :id="`measurement-${name}`"
              v-model="form[name]"
              type="text"
              inputmode="decimal"
              :class="field"
              :aria-invalid="Boolean(fieldErrors[name])"
              :aria-describedby="`measurement-${name}-help`"
            />
            <p :id="`measurement-${name}-help`" :class="errorText">{{ fieldErrors[name] ?? '' }}</p>
          </div>
        </fieldset>

        <p v-if="formError" class="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
          {{ formError }}
        </p>
      </div>

      <footer class="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
        <button
          type="button"
          class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
          :class="focus"
          :disabled="isSaving"
          @click="emit('close')"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="submit"
          class="rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-40"
          :class="focus"
          :disabled="isSaving"
        >
          {{ entry ? t('body.measurements.save') : t('body.measurements.add') }}
        </button>
      </footer>
    </form>
  </BaseDialog>
</template>
