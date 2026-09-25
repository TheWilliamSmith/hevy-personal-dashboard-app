<script setup lang="ts">
import type { DeepReadonly } from 'vue';

import CsvImportSection from '@/components/data/CsvImportSection.vue';
import HevyConnectionCard from '@/components/data/HevyConnectionCard.vue';
import SyncHistoryTable from '@/components/data/SyncHistoryTable.vue';
import { useCelebrations } from '@/composables/useCelebrations';
import { useSyncRuns } from '@/composables/useSyncRuns';
import type { HevySyncRun } from '@/types/hevy';

const syncRuns = useSyncRuns();
const celebrations = useCelebrations();

function onSyncFinished(run: DeepReadonly<HevySyncRun>): void {
  syncRuns.refresh();
  if (run.newAchievements && run.newAchievements.length > 0) {
    celebrations.enqueue(run.newAchievements);
  }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <h1 class="text-2xl font-semibold text-slate-900">Data</h1>

    <HevyConnectionCard @sync-finished="onSyncFinished" />

    <SyncHistoryTable
      :runs="syncRuns.runs.value"
      :meta="syncRuns.meta.value"
      :is-loading="syncRuns.isLoading.value"
      :error="syncRuns.error.value"
      :expanded-id="syncRuns.expandedId.value"
      @retry="syncRuns.refresh"
      @toggle="syncRuns.toggleRow"
      @page="syncRuns.goToPage"
    />

    <section>
      <h2 class="text-lg font-semibold text-slate-900">CSV import</h2>
      <p class="mt-1 mb-4 text-sm text-slate-500">
        Use this for a one-off import, or to keep your data current by hand if your Hevy
        subscription lapses and the connection above stops syncing.
      </p>
      <CsvImportSection />
    </section>
  </div>
</template>
