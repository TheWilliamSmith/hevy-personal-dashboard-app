<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronRight, SlidersHorizontal } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AttentionSpotlight from '@/components/progress/AttentionSpotlight.vue';
import MuteButton from '@/components/progress/MuteButton.vue';
import ProgressRow from '@/components/progress/ProgressRow.vue';
import ProgressSettings from '@/components/progress/ProgressSettings.vue';
import StatusOverview from '@/components/progress/StatusOverview.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useProgressAlerts, type ProgressSort } from '@/composables/useProgressAlerts';
import { useToasts } from '@/composables/useToasts';
import { ATTENTION_STATUSES, STATUS_STYLES, WINDOWS } from '@/constants/progress';
import type { MutedExercise, ProgressItem, ProgressWindow } from '@/types/progress';

const progress = useProgressAlerts();
const { push } = useToasts();

const showSettings = ref(false);
const showMuted = ref(false);

const sorts = computed<ReadonlyArray<{ value: ProgressSort; label: string }>>(() => [
  { value: 'priority', label: t('progress.sortPriority') },
  { value: 'slope', label: t('progress.sortSlope') },
  { value: 'gap', label: t('progress.sortGap') },
  { value: 'lastPR', label: t('progress.sortLastPR') },
  { value: 'lastDone', label: t('progress.sortLastDone') },
  { value: 'name', label: t('progress.sortName') },
]);

const WINDOW_OPTIONS: ReadonlyArray<SegmentedOption<ProgressWindow>> = WINDOWS;

const windowLabel = computed(
  () => WINDOWS.find((item) => item.value === progress.draft.window)?.label ?? '',
);

const concerns = computed(() =>
  progress.items.value.filter((item) => ATTENTION_STATUSES.includes(item.status)).slice(0, 3),
);

const isGloballyEmpty = computed(
  () => progress.hasLoaded.value && progress.total.value === 0 && progress.muted.value.length === 0,
);

const listTitle = computed(() =>
  progress.status.value ? STATUS_STYLES[progress.status.value].label : t('progress.allExercises'),
);

const sortLabel = computed(
  () => sorts.value.find((option) => option.value === progress.sort.value)?.label.toLowerCase() ?? '',
);

const emptyMessage = computed(() =>
  progress.status.value ? STATUS_STYLES[progress.status.value].empty : t('progress.noMatch'),
);

async function mute(item: ProgressItem, reason: string | null): Promise<void> {
  if (!(await progress.mute(item, reason))) {
    push({
      tone: 'error',
      title: t('progress.muteFailed', { name: item.name }),
      description: progress.muteError.value ?? undefined,
    });
  }
}

async function unmute(entry: MutedExercise): Promise<void> {
  if (!(await progress.unmute(entry))) {
    push({
      tone: 'error',
      title: t('progress.unmuteFailed', { name: entry.name }),
      description: progress.muteError.value ?? undefined,
    });
  }
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <Teleport to="#topbar-actions" defer>
      <SegmentedControl
        :options="WINDOW_OPTIONS"
        :model-value="progress.draft.window"
        :label="t('progress.window')"
        @update:model-value="progress.updateDraft({ window: $event })"
      />
      <button
        type="button"
        class="relative rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        :class="[focus, { 'bg-zinc-800 text-white': showSettings }]"
        :aria-label="t('progress.settings')"
        aria-controls="progress-settings"
        :aria-expanded="showSettings"
        @click="showSettings = !showSettings"
      >
        <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
        <span
          v-if="!progress.isDefault.value"
          class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500"
          aria-hidden="true"
        />
      </button>
    </Teleport>

    <div class="flex flex-col gap-10 pt-6">
      <ProgressSettings
        v-if="showSettings"
        :draft="progress.draft"
        :counts="progress.counts.value"
        :total="progress.total.value"
        :is-default="progress.isDefault.value"
        :is-loading="progress.isLoading.value"
        @change="progress.updateDraft"
        @reset="progress.resetDefaults"
      />

      <EmptyState v-if="isGloballyEmpty" import-link :message="t('progress.noHistory')" />

      <SectionError v-else-if="progress.error.value" :message="progress.error.value" @retry="progress.refresh" />

      <template v-else>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
          <StatusOverview
            class="lg:pr-8"
            :counts="progress.counts.value"
            :total="progress.total.value"
            :active="progress.status.value"
            :window-label="windowLabel"
            :is-loading="!progress.hasLoaded.value"
            @select="progress.setStatus"
          />
          <AttentionSpotlight
            class="border-zinc-800 lg:border-l lg:pl-8"
            :counts="progress.counts.value"
            :total="progress.total.value"
            :concerns="concerns"
            :is-loading="!progress.hasLoaded.value"
          />
        </div>

        <section class="flex flex-col gap-2">
          <SectionHeader :title="listTitle" :subtitle="t('progress.listSubtitle', { count: progress.visible.value.length, sort: sortLabel })">
            <div class="flex items-center gap-2">
              <button
                v-if="progress.status.value"
                type="button"
                class="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-100"
                :class="focus"
                @click="progress.setStatus(null)"
              >
                {{ t('progress.showAll') }}
              </button>
              <label class="sr-only" for="progress-sort">{{ t('progress.sort') }}</label>
              <select
                id="progress-sort"
                class="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                :class="focus"
                :value="progress.sort.value"
                @change="progress.setSort(($event.target as HTMLSelectElement).value as ProgressSort)"
              >
                <option v-for="option in sorts" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </SectionHeader>

          <ul v-if="!progress.hasLoaded.value" class="flex flex-col gap-3 pt-2" aria-busy="true">
            <li v-for="row in 8" :key="row" class="h-12 animate-pulse rounded-md bg-zinc-900" />
          </ul>

          <EmptyState v-else-if="progress.visible.value.length === 0" :message="emptyMessage" />

          <ul v-else :aria-busy="progress.isLoading.value">
            <ProgressRow
              v-for="alert in progress.visible.value"
              :key="alert.exerciseId"
              :alert="alert"
              :busy="progress.mutingId.value === alert.exerciseId"
              @mute="(reason) => mute(alert, reason)"
            />
          </ul>
        </section>

        <section v-if="progress.muted.value.length > 0" class="flex flex-col gap-2">
          <h2>
            <button
              type="button"
              class="flex items-center gap-2 rounded text-sm font-medium text-zinc-100"
              :class="focus"
              :aria-expanded="showMuted"
              aria-controls="progress-muted"
              @click="showMuted = !showMuted"
            >
              <ChevronRight class="h-4 w-4 text-zinc-500 transition-transform" :class="{ 'rotate-90': showMuted }" aria-hidden="true" />
              {{ t('progress.muted') }}
              <span class="text-xs font-normal text-zinc-500">{{ progress.muted.value.length }}</span>
            </button>
          </h2>
          <ul v-if="showMuted" id="progress-muted">
            <li
              v-for="entry in progress.muted.value"
              :key="entry.exerciseId"
              class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-zinc-800 py-2.5 pl-6 last:border-b-0"
            >
              <span class="text-sm font-medium text-zinc-200">{{ entry.name }}</span>
              <span class="min-w-0 flex-1 truncate text-xs text-zinc-500">{{ entry.muteReason ?? t('progress.noReason') }}</span>
              <RouterLink
                :to="{ name: 'home', query: { tab: 'exercises', exercise: entry.slug } }"
                class="rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                :class="focus"
                :aria-label="t('progress.openIn', { name: entry.name })"
              >
                {{ t('progress.open') }}
              </RouterLink>
              <MuteButton
                :exercise-id="entry.exerciseId"
                :exercise-name="entry.name"
                :muted="true"
                :busy="progress.mutingId.value === entry.exerciseId"
                @unmute="unmute(entry)"
              />
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>
