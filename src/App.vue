<script setup lang="ts">
import { ref } from 'vue';

import HevyImportButton from '@/components/imports/HevyImportButton.vue';
import type { ImportResult } from '@/types/imports';

const lastImport = ref<ImportResult | null>(null);

/** The parent owns dashboard data: this is where a stats refetch belongs. */
function onImported(result: ImportResult): void {
  lastImport.value = result;
}
</script>

<template>
  <main class="flex min-h-screen flex-col items-center gap-6 bg-slate-100 p-8">
    <h1 class="text-2xl font-semibold text-slate-900">Hevy Personal Dashboard</h1>
    <HevyImportButton @imported="onImported" />
    <p v-if="lastImport" class="text-sm text-slate-500">Last batch: {{ lastImport.batchId }}</p>
  </main>
</template>
