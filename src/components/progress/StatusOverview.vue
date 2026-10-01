<script setup lang="ts">
import { t } from '@/i18n';
import { computed } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { STATUS_ORDER, STATUS_STYLES } from '@/constants/progress';
import type { ProgressStatus, StatusCounts } from '@/types/progress';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  counts: StatusCounts;
  total: number;
  active: ProgressStatus | null;
  windowLabel: string;
  isLoading: boolean;
}>();

const emit = defineEmits<{ select: [status: ProgressStatus | null] }>();

const rows = computed(() =>
  STATUS_ORDER.map((status) => ({
    status,
    count: props.counts[status],
    share: props.total > 0 ? (props.counts[status] / props.total) * 100 : 0,
  })),
);

function toggle(status: ProgressStatus): void {
  emit('select', props.active === status ? null : status);
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <SectionHeader :title="t('progress.status.title')" :subtitle="t('progress.status.subtitle', { window: windowLabel })">
      <p class="text-right">
        <span
          class="text-2xl font-semibold text-white tabular-nums"
          :class="{ 'animate-pulse text-zinc-700': isLoading && total === 0 }"
        >
          {{ formatInteger(total) }}
        </span>
        <span class="block text-[11px] leading-tight text-zinc-500">{{ t('progress.status.exercises') }}</span>
      </p>
    </SectionHeader>

    <div class="flex h-2 gap-0.5 overflow-hidden rounded-full bg-zinc-900" aria-hidden="true">
      <span
        v-for="row in rows"
        v-show="row.count > 0"
        :key="row.status"
        class="h-full transition-opacity"
        :class="[STATUS_STYLES[row.status].dot, active && active !== row.status ? 'opacity-30' : '']"
        :style="{ width: `${row.share}%` }"
      />
    </div>

    <fieldset class="grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-5">
      <legend class="sr-only">{{ t('progress.status.filter') }}</legend>
      <button
        v-for="row in rows"
        :key="row.status"
        type="button"
        class="flex flex-col items-start rounded-md px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :class="active === row.status ? 'bg-zinc-800' : 'hover:bg-zinc-900'"
        :aria-pressed="active === row.status"
        @click="toggle(row.status)"
      >
        <span class="text-2xl font-semibold text-white tabular-nums">{{ formatInteger(row.count) }}</span>
        <span class="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span class="h-2 w-2 shrink-0 rounded-full" :class="STATUS_STYLES[row.status].dot" aria-hidden="true" />
          {{ STATUS_STYLES[row.status].label }}
        </span>
      </button>
    </fieldset>
  </section>
</template>
