<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronRight } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import type { HevySyncRun } from '@/types/hevy';
import type { PaginationMeta } from '@/types/workouts';
import { formatDate, formatDuration, formatInteger } from '@/utils/format';
import type { HevySyncWarning } from '@/types/hevy';

defineProps<{
  runs: HevySyncRun[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  expandedId: string | null;
}>();

const emit = defineEmits<{ retry: []; toggle: [id: string]; page: [page: number] }>();

const TRIGGER_KEYS: Readonly<Record<string, string>> = {
  MANUAL: 'data.syncHistory.manual',
  CRON: 'data.syncHistory.cron',
  POST_CONNECT: 'data.syncHistory.postConnect',
};

const STATUS: Readonly<Record<string, { key: string; dot: string; text: string }>> = {
  RUNNING: { key: 'data.syncStatus.RUNNING', dot: 'bg-blue-400', text: 'text-blue-400' },
  SUCCESS: { key: 'data.syncStatus.SUCCESS', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  PARTIAL: { key: 'data.syncHistory.partial', dot: 'bg-amber-400', text: 'text-amber-400' },
  FAILED: { key: 'data.syncStatus.FAILED', dot: 'bg-red-400', text: 'text-red-400' },
};

function statsOf(run: HevySyncRun) {
  return [
    { label: t('data.syncHistory.created'), value: run.workoutsCreated },
    { label: t('data.syncHistory.updated'), value: run.workoutsUpdated },
    { label: t('data.syncHistory.deleted'), value: run.workoutsDeleted },
    { label: t('data.syncHistory.matched'), value: run.workoutsMatched },
    { label: t('data.syncHistory.requests'), value: run.requestCount },
  ];
}

function durationOf(run: HevySyncRun): number | null {
  return run.finishedAt ? Math.round((Date.parse(run.finishedAt) - Date.parse(run.startedAt)) / 1000) : null;
}

function warningsOf(run: HevySyncRun): HevySyncWarning[] {
  return run.warnings ?? [];
}

function hasDetail(run: HevySyncRun): boolean {
  return Boolean(run.error) || warningsOf(run).length > 0;
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <SectionHeader :title="t('data.syncHistory.title')" :subtitle="meta ? t('data.syncHistory.subtitle', { count: meta.total }) : t('data.syncHistory.newestFirst')" />

    <ul v-if="isLoading && runs.length === 0" class="flex flex-col gap-3 pt-2" aria-busy="true">
      <li v-for="row in 4" :key="row" class="h-12 animate-pulse rounded-md bg-zinc-900" />
    </ul>

    <SectionError v-else-if="error" :message="error" @retry="emit('retry')" />

    <EmptyState v-else-if="runs.length === 0" :message="t('data.syncHistory.none')" />

    <ul v-else>
      <li v-for="run in runs" :key="run.id" class="border-b border-zinc-800 last:border-b-0">
        <component
          :is="hasDetail(run) ? 'button' : 'div'"
          :type="hasDetail(run) ? 'button' : undefined"
          class="grid w-full grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-3 text-left lg:grid-cols-[1rem_minmax(0,1.5fr)_7rem_repeat(5,5rem)]"
          :class="hasDetail(run) ? 'transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400' : ''"
          :aria-expanded="hasDetail(run) ? expandedId === run.id : undefined"
          :aria-controls="hasDetail(run) ? `run-detail-${run.id}` : undefined"
          @click="hasDetail(run) && emit('toggle', run.id)"
        >
          <ChevronRight
            v-if="hasDetail(run)"
            class="h-4 w-4 text-zinc-500 transition-transform"
            :class="{ 'rotate-90': expandedId === run.id }"
            aria-hidden="true"
          />
          <span v-else />
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-zinc-100">{{ formatDate(run.startedAt) }}</span>
            <span class="block text-[11px] text-zinc-500">
              {{ TRIGGER_KEYS[run.trigger] ? t(TRIGGER_KEYS[run.trigger] ?? '') : run.trigger }} · {{ formatDuration(durationOf(run)) }}
              <template v-if="warningsOf(run).length > 0">
                · <span class="text-amber-400">{{ t('data.syncHistory.toReview', { count: warningsOf(run).length }) }}</span>
              </template>
            </span>
          </span>
          <span class="flex items-center gap-1.5 text-xs" :class="STATUS[run.status]?.text">
            <span class="h-2 w-2 rounded-full" :class="STATUS[run.status]?.dot" aria-hidden="true" />
            {{ STATUS[run.status] ? t(STATUS[run.status]?.key ?? '') : run.status }}
          </span>
          <span
            v-for="stat in statsOf(run)"
            :key="stat.label"
            class="hidden flex-col lg:flex"
          >
            <span class="text-sm text-zinc-100 tabular-nums">{{ formatInteger(stat.value) }}</span>
            <span class="text-[11px] text-zinc-500">{{ stat.label }}</span>
          </span>
        </component>

        <div
          v-if="expandedId === run.id && hasDetail(run)"
          :id="`run-detail-${run.id}`"
          class="mb-3 ml-7 flex flex-col gap-3 rounded-md bg-zinc-900 px-4 py-3"
        >
          <p v-if="run.error" class="text-sm text-red-300" role="alert">{{ run.error }}</p>
          <ul v-if="warningsOf(run).length > 0" class="flex flex-col gap-1.5 text-xs">
            <li v-for="(warning, index) in warningsOf(run)" :key="index" class="flex items-start gap-2 text-zinc-300">
              <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
              <span v-if="warning.type === 'UNMAPPED_MUSCLE_GROUP'">
                <i18n-t keypath="data.syncHistory.unknownMuscle" scope="global">
                  <template #exercise>
                    <RouterLink
                      :to="{ name: 'home', query: { tab: 'exercises', q: warning.exerciseTitle } }"
                      class="font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
                    >
                      {{ warning.exerciseTitle }}
                    </RouterLink>
                  </template>
                </i18n-t>{{ warning.rawValue ? t('data.syncHistory.hevyValue', { value: warning.rawValue }) : '' }}
              </span>
              <i18n-t v-else keypath="data.syncHistory.overlaps" tag="span" scope="global">
                <template #title>{{ warning.title }}</template>
                <template #workout>
                  <RouterLink
                    :to="{ name: 'home', query: { tab: 'workouts', workout: warning.existingWorkoutId } }"
                    class="font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
                  >
                    {{ warning.existingTitle }}
                  </RouterLink>
                </template>
              </i18n-t>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <Pagination
      v-if="meta && meta.totalPages > 1"
      class="pt-2"
      :meta="meta"
      :label="t('data.syncHistory.pagination')"
      :unit="t('data.syncHistory.unit')"
      @change="emit('page', $event)"
    />
  </section>
</template>
