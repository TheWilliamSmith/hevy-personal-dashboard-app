<script setup lang="ts">
import { computed, ref, type DeepReadonly } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useToasts } from '@/composables/useToasts';
import { LOCALES, locale, setLocale, t } from '@/i18n';
import { ApiError, apiPost } from '@/lib/api';
import type { ProfileChanges, RecapFrequency, UserProfile, WeekStart, WeightUnit } from '@/types/profile';
import { dateFormat } from '@/utils/format';

const props = defineProps<{ profile: DeepReadonly<UserProfile>; isSaving: boolean }>();

const emit = defineEmits<{ change: [changes: ProfileChanges] }>();

const units = computed<ReadonlyArray<SegmentedOption<WeightUnit>>>(() => [
  { value: 'kg', label: t('preferences.kilograms') },
  { value: 'lb', label: t('preferences.pounds') },
]);

const weekStarts = computed<ReadonlyArray<SegmentedOption<WeekStart>>>(() => [
  { value: 'monday', label: t('preferences.monday') },
  { value: 'sunday', label: t('preferences.sunday') },
]);

const frequencies = computed<ReadonlyArray<SegmentedOption<RecapFrequency>>>(() => [
  { value: 'off', label: t('preferences.recapOff') },
  { value: 'weekly', label: t('preferences.recapWeekly') },
  { value: 'monthly', label: t('preferences.recapMonthly') },
]);

const FIRST_MONDAY = Date.UTC(2024, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, index) => ({
    value: index + 1,
    label: dateFormat({ weekday: 'long', timeZone: 'UTC' }).format(new Date(FIRST_MONDAY + index * DAY_MS)),
  })),
);

const recapHint = computed(() => {
  switch (props.profile.recapFrequency) {
    case 'weekly':
      return t('preferences.recapWeeklyHint', {
        day: weekdays.value.find((day) => day.value === props.profile.recapWeekday)?.label ?? '',
      });
    case 'monthly':
      return t('preferences.recapMonthlyHint', { day: props.profile.recapMonthDay });
    default:
      return t('preferences.recapOffHint');
  }
});

const { push } = useToasts();
const isSending = ref(false);

async function sendRecap(): Promise<void> {
  isSending.value = true;
  try {
    const { sentTo } = await apiPost<{ sentTo: string }>('/me/recap/send', {});
    push({ tone: 'success', title: t('preferences.recapSent', { email: sentTo }) });
  } catch (error_) {
    push({
      tone: 'error',
      title: t('preferences.recapSendFailed'),
      description: error_ instanceof ApiError ? error_.message : undefined,
    });
  } finally {
    isSending.value = false;
  }
}

function selectNumber(event: Event): number {
  return Number((event.target as HTMLSelectElement).value);
}

const label = 'text-xs text-zinc-400';
const field =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:w-56';
</script>

<template>
  <div class="flex flex-col gap-8">
    <section class="flex max-w-3xl flex-col gap-5">
      <SectionHeader :title="t('preferences.languageTitle')" :subtitle="t('preferences.languageSubtitle')" />
      <div class="flex flex-col gap-2">
        <span :class="label">{{ t('preferences.language') }}</span>
        <SegmentedControl
          :model-value="locale"
          :options="LOCALES"
          :label="t('preferences.language')"
          class="self-start"
          @update:model-value="setLocale"
        />
        <p class="text-xs text-zinc-500">{{ t('preferences.languageHint') }}</p>
      </div>
    </section>

    <section class="flex max-w-3xl flex-col gap-5 border-t border-zinc-800 pt-8" :aria-busy="isSaving">
      <SectionHeader :title="t('preferences.unitsTitle')" :subtitle="t('preferences.unitsSubtitle')" />
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <span :class="label">{{ t('preferences.weightUnit') }}</span>
          <SegmentedControl
            :model-value="profile.weightUnit"
            :options="units"
            :label="t('preferences.weightUnit')"
            class="self-start"
            @update:model-value="emit('change', { weightUnit: $event })"
          />
        </div>
        <div class="flex flex-col gap-2">
          <span :class="label">{{ t('preferences.weekStartsOn') }}</span>
          <SegmentedControl
            :model-value="profile.weekStart"
            :options="weekStarts"
            :label="t('preferences.weekStart')"
            class="self-start"
            @update:model-value="emit('change', { weekStart: $event })"
          />
        </div>
      </div>
    </section>

    <section class="flex max-w-3xl flex-col gap-5 border-t border-zinc-800 pt-8" :aria-busy="isSaving">
      <SectionHeader :title="t('preferences.recapTitle')" :subtitle="t('preferences.recapSubtitle')" />
      <div class="flex flex-col gap-2">
        <span :class="label">{{ t('preferences.recapFrequency') }}</span>
        <SegmentedControl
          :model-value="profile.recapFrequency"
          :options="frequencies"
          :label="t('preferences.recapFrequency')"
          class="self-start"
          @update:model-value="emit('change', { recapFrequency: $event })"
        />
      </div>

      <div v-if="profile.recapFrequency === 'weekly'" class="flex flex-col gap-2">
        <label for="recap-weekday" :class="label">{{ t('preferences.recapWeekday') }}</label>
        <select
          id="recap-weekday"
          :class="field"
          :value="profile.recapWeekday"
          @change="emit('change', { recapWeekday: selectNumber($event) })"
        >
          <option v-for="day in weekdays" :key="day.value" :value="day.value">{{ day.label }}</option>
        </select>
      </div>

      <div v-else-if="profile.recapFrequency === 'monthly'" class="flex flex-col gap-2">
        <label for="recap-month-day" :class="label">{{ t('preferences.recapMonthDay') }}</label>
        <select
          id="recap-month-day"
          :class="field"
          :value="profile.recapMonthDay"
          @change="emit('change', { recapMonthDay: selectNumber($event) })"
        >
          <option v-for="day in MONTH_DAYS" :key="day" :value="day">{{ day }}</option>
        </select>
      </div>

      <p class="text-xs text-zinc-500">
        {{ recapHint }}
        <template v-if="profile.recapFrequency !== 'off'">{{ t('preferences.recapSkipHint') }}</template>
      </p>

      <button
        type="button"
        class="inline-flex items-center gap-2 self-start rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:opacity-50"
        :disabled="isSending"
        :aria-busy="isSending"
        @click="sendRecap"
      >
        {{ t('preferences.recapSend') }}
      </button>
    </section>
  </div>
</template>
