<script setup lang="ts">
import { t } from '@/i18n';
import { computed, ref } from 'vue';

import DeleteBatchDialog from '@/components/imports/DeleteBatchDialog.vue';
import HevyImportButton from '@/components/imports/HevyImportButton.vue';
import ImportHistoryTable from '@/components/imports/ImportHistoryTable.vue';
import ImportPreviewModal from '@/components/imports/ImportPreviewModal.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
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
      title: t('data.csv.diverged'),
      description: t('data.csv.divergedDescription', {
        workouts: formatInteger(result.workoutsCreated),
        sets: formatInteger(result.setsCreated),
      }),
    });
    return;
  }

  push({
    tone: 'success',
    title: t('data.csv.imported', { count: formatInteger(result.workoutsCreated) }),
    description: t('data.csv.importedDescription', {
      sets: formatInteger(result.setsCreated),
      skipped: formatInteger(result.workoutsSkipped),
    }),
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
    title: deleteWorkouts ? t('data.csv.deletedAll') : t('data.csv.deletedRecord'),
    description: deleteWorkouts
      ? t('data.csv.deletedAllDescription', {
          workouts: formatInteger(rolled.workoutsDeleted),
          sets: formatInteger(rolled.setsDeleted),
        })
      : t('data.csv.deletedRecordDescription', { count: formatInteger(rolled.workoutsKept) }),
  });
}
</script>

<template>
  <div class="flex flex-col gap-10">
    <section class="flex flex-col gap-4">
      <SectionHeader :title="t('data.csv.title')" :subtitle="t('data.csv.subtitle')" />
      <p class="max-w-prose text-sm text-zinc-400">
        {{ t('data.csv.intro') }}
      </p>
      <HevyImportButton
        ref="importButton"
        :is-busy="isBusy"
        :progress="progress"
        :error="inlineError"
        :file-name="file?.name ?? null"
        @file="selectFile"
        @dismiss-error="reset"
      />
    </section>

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
