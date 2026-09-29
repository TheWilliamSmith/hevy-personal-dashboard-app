<script setup lang="ts">
import { Menu } from 'lucide-vue-next';
import { computed } from 'vue';

import ConnectionIndicator from '@/components/data/ConnectionIndicator.vue';
import { TABS, useActiveTab } from '@/composables/useActiveTab';
import { useSidebar } from '@/composables/useSidebar';

const { tab } = useActiveTab();
const { mobileOpen, openMobile } = useSidebar();

const title = computed(() => TABS.find((item) => item.name === tab.value)?.label ?? '');
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6"
  >
    <button
      type="button"
      class="-ml-1.5 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
      aria-label="Open menu"
      :aria-expanded="mobileOpen"
      @click="openMobile"
    >
      <Menu class="h-5 w-5" />
    </button>
    <h1 class="flex-1 truncate text-base font-semibold text-slate-900">{{ title }}</h1>
    <ConnectionIndicator />
  </header>
</template>
