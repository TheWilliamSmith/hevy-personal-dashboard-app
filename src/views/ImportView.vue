<script setup lang="ts">
import { useRouter } from 'vue-router';

import HevyImportButton from '@/components/imports/HevyImportButton.vue';
import type { ImportResult } from '@/types/imports';

const router = useRouter();

/** A successful import invalidates the list, so send the user straight to it. */
function onImported(result: ImportResult): void {
  if (!result.alreadyImported && result.workoutsCreated > 0) {
    void router.push({ name: 'workouts' });
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 p-6">
    <h1 class="self-start text-2xl font-semibold text-slate-900">Import</h1>
    <HevyImportButton @imported="onImported" />
  </div>
</template>
