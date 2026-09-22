<script setup lang="ts">
import { TABS, useActiveTab } from '@/composables/useActiveTab';

/**
 * These are real tabs now: one page, one panel at a time, so the ARIA tab
 * pattern applies. Arrow keys move between them, as the pattern requires.
 */
const { tab, setTab } = useActiveTab();

function onKeydown(event: KeyboardEvent, index: number): void {
  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
  if (offset === 0) {
    return;
  }

  event.preventDefault();
  const next = TABS[(index + offset + TABS.length) % TABS.length];
  if (next) {
    setTab(next.name);
  }
}

const base =
  '-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
const idle = 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800';
const selected = 'border-indigo-600 text-indigo-700';
</script>

<template>
  <div class="flex gap-6 border-b border-slate-200" role="tablist" aria-label="Sections">
    <button
      v-for="(item, index) in TABS"
      :id="`tab-${item.name}`"
      :key="item.name"
      type="button"
      role="tab"
      :class="[base, tab === item.name ? selected : idle]"
      :aria-selected="tab === item.name"
      :aria-controls="`panel-${item.name}`"
      :tabindex="tab === item.name ? 0 : -1"
      @click="setTab(item.name)"
      @keydown="onKeydown($event, index)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
