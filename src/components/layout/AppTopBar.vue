<script setup lang="ts">
import { Menu } from 'lucide-vue-next';
import { computed } from 'vue';

import ConnectionIndicator from '@/components/data/ConnectionIndicator.vue';
import { TABS, useActiveTab } from '@/composables/useActiveTab';
import { useSidebar } from '@/composables/useSidebar';

defineProps<{ dark: boolean }>();

const { tab } = useActiveTab();
const { mobileOpen, openMobile } = useSidebar();

const title = computed(() => TABS.find((item) => item.name === tab.value)?.label ?? '');
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6"
    :class="dark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'"
  >
    <button
      type="button"
      class="-ml-1.5 rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
      :class="dark ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'"
      aria-label="Open menu"
      :aria-expanded="mobileOpen"
      @click="openMobile"
    >
      <Menu class="h-5 w-5" />
    </button>
    <h1 class="flex-1 truncate text-base font-semibold" :class="dark ? 'text-white' : 'text-slate-900'">
      {{ title }}
    </h1>
    <div id="topbar-actions" class="flex items-center gap-2" />
    <ConnectionIndicator />
  </header>
</template>
