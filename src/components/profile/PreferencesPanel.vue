<script setup lang="ts">
import { computed, type DeepReadonly } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { LOCALES, locale, setLocale, t } from '@/i18n';
import type { ProfileChanges, UserProfile, WeekStart, WeightUnit } from '@/types/profile';

defineProps<{ profile: DeepReadonly<UserProfile>; isSaving: boolean }>();

const emit = defineEmits<{ change: [changes: ProfileChanges] }>();

const units = computed<ReadonlyArray<SegmentedOption<WeightUnit>>>(() => [
  { value: 'kg', label: t('preferences.kilograms') },
  { value: 'lb', label: t('preferences.pounds') },
]);

const weekStarts = computed<ReadonlyArray<SegmentedOption<WeekStart>>>(() => [
  { value: 'monday', label: t('preferences.monday') },
  { value: 'sunday', label: t('preferences.sunday') },
]);

const label = 'text-xs text-zinc-400';
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
  </div>
</template>
