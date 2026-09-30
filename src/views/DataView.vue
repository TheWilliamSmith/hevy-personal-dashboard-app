<script setup lang="ts">
import type { DeepReadonly } from 'vue';

import CsvImportSection from '@/components/data/CsvImportSection.vue';
import DataSpotlight from '@/components/data/DataSpotlight.vue';
import HevyConnectionSection from '@/components/data/HevyConnectionSection.vue';
import SyncHistoryTable from '@/components/data/SyncHistoryTable.vue';
import { useCelebrations } from '@/composables/useCelebrations';
import { useHevyConnection } from '@/composables/useHevyConnection';
import { useSyncRuns } from '@/composables/useSyncRuns';
import type { HevySyncRun } from '@/types/hevy';

const syncRuns = useSyncRuns();
const celebrations = useCelebrations();
const connection = useHevyConnection();

function onSyncFinished(run: DeepReadonly<HevySyncRun>): void {
  syncRuns.refresh();
  if (run.newAchievements && run.newAchievements.length > 0) {
    celebrations.enqueue(run.newAchievements);
  }
}
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <HevyConnectionSection class="lg:pr-8" @sync-finished="onSyncFinished" />
        <DataSpotlight class="border-zinc-800 lg:border-l lg:pl-8" />
      </div>

      <SyncHistoryTable
        v-if="connection.state.value?.connected || syncRuns.runs.value.length > 0"
        :runs="syncRuns.runs.value"
        :meta="syncRuns.meta.value"
        :is-loading="syncRuns.isLoading.value"
        :error="syncRuns.error.value"
        :expanded-id="syncRuns.expandedId.value"
        @retry="syncRuns.refresh"
        @toggle="syncRuns.toggleRow"
        @page="syncRuns.goToPage"
      />

      <CsvImportSection />
    </div>
  </div>
</template>
