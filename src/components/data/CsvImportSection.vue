<script setup lang="ts">
import { computed, ref } from 'vue';

import DeleteBatchDialog from '@/components/imports/DeleteBatchDialog.vue';
import HevyImportButton from '@/components/imports/HevyImportButton.vue';
import ImportHistoryTable from '@/components/imports/ImportHistoryTable.vue';
import ImportPreviewModal from '@/components/imports/ImportPreviewModal.vue';
import { useHevyImport } from '@/composables/useHevyImport';
import { useImportBatches } from '@/composables/useImportBatches';
import { useCelebrations } from '@/composables/useCelebrations';
import { useToasts } from '@/composables/useToasts';
import type { ImportBatchSummary } from '@/types/imports';
import { formatInteger } from '@/utils/format';

const {
  status,
  file,
  preview,
  error,
  progress,
  selectFile,
  cancel,
  confirm,
  reset,
} = useHevyImport();

const batches = useImportBatches();
const { push } = useToasts();
const celebrations = useCelebrations();

const importButton = ref<InstanceType<typeof HevyImportButton> | null>(null);
const pendingDelete = ref<ImportBatchSummary | null>(null);

const isBusy = computed(() => status.value === 'uploading');
const isConfirming = computed(() => status.value === 'confirming');

const dialogError = computed(() => (status.value === 'error' && preview.value ? error.value?.message ?? null : null));
const inlineError = computed(() => (preview.value ? null : error.value?.message ?? null));

async function onConfirm(): Promise<void> {
  const result = await confirm();
  if (!result) {
    return;
  }

  batches.refresh();

  if (result.newAchievements && result.newAchievements.length > 0) {
    celebrations.enqueue(result.newAchievements);
  }

  if (result.divergedFromPreview) {
    push({
      tone: 'warning',
      title: 'Imported, but the preview was out of date',
      description:
        `Your data changed between the preview and the import, so the final numbers differ: ` +
        `${formatInteger(result.workoutsCreated)} workouts and ${formatInteger(result.setsCreated)} sets created.`,
    });
    return;
  }

  push({
    tone: 'success',
    title: `Imported ${formatInteger(result.workoutsCreated)} workouts`,
    description: `${formatInteger(result.setsCreated)} sets created, ${formatInteger(result.workoutsSkipped)} already present.`,
  });
}

function onReupload(): void {
  reset();
  importButton.value?.focus();
}

async function onDeleteConfirmed(deleteWorkouts: boolean): Promise<void> {
  const batch = pendingDelete.value;
  if (!batch) {
    return;
  }

  const rolled = await batches.rollback(batch.id, deleteWorkouts);
  if (!rolled) {
    return;
  }

  pendingDelete.value = null;

  push({
    tone: 'success',
    title: deleteWorkouts ? 'Import and workouts deleted' : 'Import record deleted',
    description: deleteWorkouts
      ? `${formatInteger(rolled.workoutsDeleted)} workouts and ${formatInteger(rolled.setsDeleted)} sets removed.`
      : `${formatInteger(rolled.workoutsKept)} workouts kept.`,
  });
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <HevyImportButton
        ref="importButton"
        :is-busy="isBusy"
        :progress="progress"
        :error="inlineError"
        :file-name="file?.name ?? null"
        @file="selectFile"
        @dismiss-error="reset"
      />
    </div>

    <ImportHistoryTable
      :batches="batches.batches.value"
      :meta="batches.meta.value"
      :is-loading="batches.isLoading.value"
      :error="batches.error.value"
      :expanded-id="batches.expandedId.value"
      :detail="batches.detail.value"
      :is-detail-loading="batches.isDetailLoading.value"
      :detail-error="batches.detailError.value"
      :deleting-id="batches.deletingId.value"
      @retry="batches.refresh"
      @toggle="batches.toggleRow"
      @request-delete="pendingDelete = $event"
      @page="batches.goToPage"
    />

    <ImportPreviewModal
      :preview="preview"
      :is-confirming="isConfirming"
      :error="dialogError"
      @cancel="cancel"
      @confirm="onConfirm"
      @reupload="onReupload"
    />

    <DeleteBatchDialog
      :batch="pendingDelete"
      :is-deleting="batches.deletingId.value !== null"
      :error="batches.deleteError.value"
      @cancel="pendingDelete = null"
      @confirm="onDeleteConfirmed"
    />
  </div>
</template>
