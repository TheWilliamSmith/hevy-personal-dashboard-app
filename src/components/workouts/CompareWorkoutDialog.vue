<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

import BaseDialog from '@/components/ui/BaseDialog.vue';
import { t } from '@/i18n';
import { ApiError, apiGet } from '@/lib/api';
import type { Paginated, WorkoutDetail, WorkoutSummary } from '@/types/workouts';
import { formatDate, formatVolume } from '@/utils/format';
import { suggestReference } from '@/utils/workout-compare';

const props = defineProps<{
  open: boolean;
  workout: Pick<WorkoutDetail, 'id' | 'title' | 'startedAt'>;
  selectedId?: string | null;
}>();

const emit = defineEmits<{ close: []; select: [id: string] }>();

const SEARCH_DELAY_MS = 250;
const RESULT_LIMIT = 50;
const SUGGESTION_LIMIT = 20;

const query = ref('');
const results = ref<WorkoutSummary[]>([]);
const suggestion = ref<WorkoutSummary | null>(null);
const chosenId = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

let timer: ReturnType<typeof setTimeout> | null = null;
let controller: AbortController | null = null;

async function search(term: string): Promise<WorkoutSummary[]> {
  controller?.abort();
  controller = new AbortController();
  const page = await apiGet<Paginated<WorkoutSummary>>(
    '/workouts',
    { limit: RESULT_LIMIT, ...(term.trim() ? { search: term.trim() } : {}) },
    controller.signal,
  );
  return page.data.filter((candidate) => candidate.id !== props.workout.id);
}

async function findSuggestion(): Promise<WorkoutSummary | null> {
  try {
    const before = new Date(Date.parse(props.workout.startedAt) - 1).toISOString();
    const page = await apiGet<Paginated<WorkoutSummary>>('/workouts', {
      search: props.workout.title,
      to: before,
      limit: SUGGESTION_LIMIT,
    });
    return suggestReference(props.workout, page.data);
  } catch {
    return null;
  }
}

async function load(term: string): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    results.value = await search(term);
    isLoading.value = false;
  } catch (error_) {
    if (error_ instanceof DOMException && error_.name === 'AbortError') {
      return;
    }
    error.value = error_ instanceof ApiError ? error_.message : t('errors.generic');
    isLoading.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    query.value = props.workout.title;
    chosenId.value = props.selectedId ?? null;
    const [suggested] = await Promise.all([findSuggestion(), load(query.value)]);
    suggestion.value = suggested;
    chosenId.value ??= suggested?.id ?? null;
  },
  { immediate: true },
);

function onInput(): void {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => void load(query.value), SEARCH_DELAY_MS);
}

const ordered = computed(() => {
  const suggested = suggestion.value;
  if (!suggested || !query.value.trim() || query.value.trim() !== props.workout.title.trim()) {
    return results.value;
  }
  return [suggested, ...results.value.filter((candidate) => candidate.id !== suggested.id)];
});

function confirm(): void {
  if (chosenId.value) {
    emit('select', chosenId.value);
  }
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <BaseDialog :open="open" labelled-by="compare-workout-title" size="md" @close="emit('close')">
    <header class="border-b border-zinc-800 px-5 py-4">
      <h2 id="compare-workout-title" class="text-base font-semibold text-white">{{ t('workouts.compare.dialogTitle') }}</h2>
      <p class="mt-0.5 text-sm text-zinc-400">{{ t('workouts.compare.dialogSubtitle') }}</p>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
      <label for="compare-search" class="sr-only">{{ t('workouts.compare.search') }}</label>
      <div class="relative">
        <Search class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        <input
          id="compare-search"
          v-model="query"
          type="search"
          autocomplete="off"
          :placeholder="t('workouts.compare.searchPlaceholder')"
          class="w-full rounded-md border border-zinc-700 bg-zinc-950 py-2 pr-3 pl-8 text-sm text-zinc-100 placeholder:text-zinc-600"
          :class="focus"
          @input="onInput"
        />
      </div>

      <p v-if="error" class="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
        {{ error }}
      </p>

      <ul
        class="max-h-80 divide-y divide-zinc-800 overflow-y-auto rounded-md border border-zinc-800"
        role="radiogroup"
        :aria-label="t('workouts.compare.search')"
        :aria-busy="isLoading"
      >
        <li v-if="isLoading && results.length === 0" class="px-3 py-6 text-center text-sm text-zinc-500">
          {{ t('workouts.compare.loading') }}
        </li>
        <li v-else-if="results.length === 0" class="px-3 py-6 text-center text-sm text-zinc-500">
          {{ t('workouts.compare.noResult') }}
        </li>
        <li v-for="candidate in ordered" :key="candidate.id">
          <label class="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-zinc-800">
            <input v-model="chosenId" type="radio" name="compare-workout" :value="candidate.id" class="mt-1 accent-blue-600" />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-zinc-100">{{ candidate.title }}</span>
                <span
                  v-if="candidate.id === suggestion?.id"
                  class="shrink-0 rounded bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-300"
                >
                  {{ t('workouts.compare.suggested') }}
                </span>
              </span>
              <span class="block text-xs text-zinc-500">
                <time :datetime="candidate.startedAt">{{ formatDate(candidate.startedAt) }}</time>
                · {{ formatVolume(candidate.totalVolumeKg) }}
              </span>
            </span>
          </label>
        </li>
      </ul>

      <p v-if="suggestion" class="text-xs text-zinc-500">{{ t('workouts.compare.suggestionHint') }}</p>
    </div>

    <footer class="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        :class="focus"
        @click="emit('close')"
      >
        {{ t('common.cancel') }}
      </button>
      <button
        type="button"
        class="rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!chosenId"
        @click="confirm"
      >
        {{ t('workouts.compare.confirm') }}
      </button>
    </footer>
  </BaseDialog>
</template>
