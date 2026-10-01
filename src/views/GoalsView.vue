<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronRight, Plus } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import GoalFormDialog, { type GoalSubmission } from '@/components/goals/GoalFormDialog.vue';
import GoalRow from '@/components/goals/GoalRow.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { GOAL_STATUS_STYLES } from '@/constants/goals';
import { useGoals } from '@/composables/useGoals';
import { useToasts } from '@/composables/useToasts';
import { ApiError } from '@/lib/api';
import type { Goal, GoalStatus } from '@/types/goals';
import { goalTitle } from '@/utils/goals';

const goals = useGoals({ includeArchived: true });
const { push } = useToasts();

const formOpen = ref(false);
const editing = ref<Goal | null>(null);
const deleting = ref<Goal | null>(null);
const deleteError = ref<string | null>(null);
const busyId = ref<string | null>(null);
const showArchived = ref(false);

const STATUS_ORDER: readonly GoalStatus[] = ['ACHIEVED', 'ON_TRACK', 'OFF_TRACK', 'NOT_ENOUGH_DATA'];

const counts = computed(() => {
  const tally: Record<GoalStatus, number> = { ACHIEVED: 0, ON_TRACK: 0, OFF_TRACK: 0, NOT_ENOUGH_DATA: 0 };
  for (const goal of goals.active.value) {
    tally[goal.progress.status] += 1;
  }
  return tally;
});

const healthy = computed(() => counts.value.ACHIEVED + counts.value.ON_TRACK);

function openCreate(): void {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(goal: Goal): void {
  editing.value = goal;
  formOpen.value = true;
}

async function submitGoal(submission: GoalSubmission): Promise<void> {
  if (submission.kind === 'create') {
    const goal = await goals.create(submission.input);
    push({ tone: 'success', title: t('goals.created'), description: goalTitle(goal) });
  } else {
    await goals.update(submission.id, submission.changes);
    push({ tone: 'success', title: t('goals.updated') });
  }
}

async function setArchived(goal: Goal, archived: boolean): Promise<void> {
  busyId.value = goal.id;
  try {
    await goals.update(goal.id, { archived });
    push({ tone: 'success', title: archived ? t('goals.archived') : t('goals.restored'), description: goalTitle(goal) });
  } catch (error_) {
    push({ tone: 'error', title: t('goals.updateFailed'), description: error_ instanceof ApiError ? error_.message : undefined });
  } finally {
    busyId.value = null;
  }
}

async function confirmDelete(): Promise<void> {
  const goal = deleting.value;
  if (!goal) {
    return;
  }
  busyId.value = goal.id;
  deleteError.value = null;
  try {
    await goals.remove(goal.id);
    deleting.value = null;
    push({ tone: 'success', title: t('goals.deleted'), description: goalTitle(goal) });
  } catch (error_) {
    deleteError.value = error_ instanceof ApiError ? error_.message : t('goals.deleteFailed');
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <Teleport to="#topbar-actions" defer>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        {{ t('goals.newGoal') }}
      </button>
    </Teleport>

    <div class="flex flex-col gap-10 pt-6">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <section class="flex flex-col gap-2 lg:pr-8">
          <SectionHeader :title="t('goals.active')" :subtitle="t('goals.furthestBehind')" />

          <SectionError v-if="goals.error.value" :message="goals.error.value" @retry="goals.load" />

          <ul v-else-if="!goals.hasLoaded.value" class="flex flex-col gap-3 pt-2" aria-busy="true">
            <li v-for="row in 3" :key="row" class="h-20 animate-pulse rounded-md bg-zinc-900" />
          </ul>

          <EmptyState v-else-if="goals.active.value.length === 0" :message="t('goals.noActive')">
            <button
              type="button"
              class="text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
              @click="openCreate"
            >
              {{ t('goals.setFirst') }}
            </button>
          </EmptyState>

          <ul v-else>
            <GoalRow
              v-for="goal in goals.active.value"
              :key="goal.id"
              :goal="goal"
              :busy="busyId === goal.id"
              @edit="openEdit(goal)"
              @archive="setArchived(goal, true)"
              @remove="deleting = goal"
            />
          </ul>
        </section>

        <section class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:pl-8">
          <SectionHeader :title="t('goals.onTrack')" :subtitle="t('goals.onTrackSubtitle')" />
          <p
            class="text-5xl font-semibold tracking-tight text-white tabular-nums"
            :class="{ 'animate-pulse text-zinc-700': !goals.hasLoaded.value }"
          >
            {{ healthy }}<span class="text-3xl text-zinc-500"> / {{ goals.active.value.length }}</span>
          </p>
          <dl class="mt-2 flex flex-col gap-2">
            <div v-for="status in STATUS_ORDER" :key="status" class="flex items-center justify-between text-sm">
              <dt class="flex items-center gap-2 text-zinc-400">
                <span class="h-2 w-2 rounded-full" :class="GOAL_STATUS_STYLES[status].dot" aria-hidden="true" />
                {{ GOAL_STATUS_STYLES[status].label }}
              </dt>
              <dd class="text-zinc-100 tabular-nums">{{ counts[status] }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section v-if="goals.archived.value.length > 0" class="flex flex-col gap-2">
        <button
          type="button"
          class="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          :aria-expanded="showArchived"
          aria-controls="archived-goals"
          @click="showArchived = !showArchived"
        >
          <ChevronRight class="h-4 w-4 text-zinc-500 transition-transform" :class="{ 'rotate-90': showArchived }" aria-hidden="true" />
          {{ t('goals.archivedGoals') }}
          <span class="text-xs font-normal text-zinc-500 tabular-nums">{{ goals.archived.value.length }}</span>
        </button>
        <ul v-if="showArchived" id="archived-goals">
          <GoalRow
            v-for="goal in goals.archived.value"
            :key="goal.id"
            :goal="goal"
            :busy="busyId === goal.id"
            @restore="setArchived(goal, false)"
            @remove="deleting = goal"
          />
        </ul>
      </section>
    </div>

    <GoalFormDialog :open="formOpen" :goal="editing" :submit="submitGoal" @close="formOpen = false" />

    <ConfirmDialog
      :open="deleting !== null"
      labelled-by="delete-goal-title"
      :title="t('goals.deleteTitle')"
      :confirm-label="t('goals.deleteConfirm')"
      tone="danger"
      :is-busy="busyId !== null && busyId === deleting?.id"
      :error="deleteError"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    >
      <i18n-t keypath="goals.deleteBody" tag="p" scope="global">
        <template #goal>
          <span class="font-medium text-zinc-100">{{ deleting ? goalTitle(deleting) : '' }}</span>
        </template>
      </i18n-t>
    </ConfirmDialog>
  </div>
</template>
