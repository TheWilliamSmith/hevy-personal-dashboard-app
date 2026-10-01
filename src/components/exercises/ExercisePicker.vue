<script setup lang="ts">
import { t } from '@/i18n';
import { Search, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

import { searchExercises, type SearchableExercise } from '@/utils/exercise-search';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  id: string;
  exercises: readonly SearchableExercise[];
  invalid?: boolean;
  describedBy?: string;
}>();

const model = defineModel<string>({ required: true });

const query = ref('');
const open = ref(false);
const highlighted = ref(0);

const selected = computed(() => props.exercises.find((exercise) => exercise.id === model.value) ?? null);
const results = computed(() => searchExercises(props.exercises, query.value));
const listId = computed(() => `${props.id}-results`);
const optionId = (index: number) => `${props.id}-option-${index}`;

watch(
  selected,
  (exercise) => {
    if (exercise && !open.value) {
      query.value = exercise.name;
    }
  },
  { immediate: true },
);

watch(results, () => {
  highlighted.value = 0;
});

function onInput(): void {
  open.value = true;
  if (selected.value && query.value !== selected.value.name) {
    model.value = '';
  }
}

function choose(exercise: SearchableExercise): void {
  model.value = exercise.id;
  query.value = exercise.name;
  open.value = false;
}

function clear(): void {
  model.value = '';
  query.value = '';
  open.value = true;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    open.value = true;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const count = results.value.length;
    highlighted.value = count === 0 ? 0 : (highlighted.value + step + count) % count;
    return;
  }
  if (event.key === 'Enter' && open.value) {
    const exercise = results.value[highlighted.value];
    if (exercise) {
      event.preventDefault();
      choose(exercise);
    }
    return;
  }
  if (event.key === 'Escape' && open.value) {
    event.stopPropagation();
    open.value = false;
  }
}

function onBlur(): void {
  open.value = false;
  if (selected.value) {
    query.value = selected.value.name;
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="relative">
      <Search class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
      <input
        :id="id"
        v-model="query"
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        :placeholder="t('exercises.picker.placeholder')"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="open && results.length > 0 ? optionId(highlighted) : undefined"
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        class="w-full rounded-md border border-zinc-700 bg-zinc-950 py-1.5 pr-8 pl-8 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :class="{ 'border-red-500/60': invalid }"
        @focus="open = true"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
      />
      <button
        v-if="query"
        type="button"
        class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-400"
        :aria-label="t('exercises.picker.clear')"
        @mousedown.prevent
        @click="clear"
      >
        <X class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>

    <ul
      v-show="open"
      :id="listId"
      role="listbox"
      :aria-label="query ? t('exercises.picker.matching', { query }) : t('exercises.picker.mostPerformed')"
      class="max-h-60 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 p-1"
    >
      <li
        v-for="(exercise, index) in results"
        :id="optionId(index)"
        :key="exercise.id"
        role="option"
        :aria-selected="exercise.id === model"
        class="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-sm"
        :class="index === highlighted ? 'bg-zinc-800 text-white' : 'text-zinc-200'"
        @mousedown.prevent="choose(exercise)"
        @mousemove="highlighted = index"
      >
        <span class="truncate">{{ exercise.name }}</span>
        <span class="shrink-0 text-[11px] text-zinc-500 tabular-nums">
          {{
            exercise.sessions
              ? t('exercises.sessionCount', { count: formatInteger(exercise.sessions) }, exercise.sessions)
              : t('exercises.neverPerformed')
          }}
        </span>
      </li>
      <li v-if="results.length === 0" class="px-2 py-3 text-center text-sm text-zinc-500" role="presentation">
        {{ t('exercises.picker.noMatch', { query }) }}
      </li>
    </ul>
  </div>
</template>
