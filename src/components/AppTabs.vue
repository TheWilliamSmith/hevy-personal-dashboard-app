<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

import { TABS, useActiveTab } from '@/composables/useActiveTab';

/**
 * These are real tabs now: one page, one panel at a time, so the ARIA tab
 * pattern applies. Arrow keys move between them, as the pattern requires.
 */
const { tab, setTab } = useActiveTab();

const list = ref<HTMLElement | null>(null);

/**
 * On a phone the row scrolls, so the active tab can sit off-screen — e.g. a
 * shared ?tab=imports link. Keep it visible without moving the page itself.
 */
async function revealActive(): Promise<void> {
  await nextTick();
  const row = list.value;
  const active = row?.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!row || !active) {
    return;
  }
  // Scrolls the tab row only. scrollIntoView() also scrolled the window,
  // pushing the header title out of view on load.
  row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
}

onMounted(revealActive);
watch(tab, revealActive);

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
  'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
const idle = 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800';
const selected = 'border-indigo-600 text-indigo-700';
</script>

<template>
  <!-- Five tabs overflow a phone; the row scrolls sideways instead of clipping. -->
  <div
    ref="list"
    class="relative -mb-px flex gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none]"
    role="tablist"
    aria-label="Sections"
  >
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
