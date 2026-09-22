<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppTabs from '@/components/AppTabs.vue';
import { useActiveTab } from '@/composables/useActiveTab';

const { tab, isFullWidth } = useActiveTab();
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="bg-white">
      <!--
        The header keeps one width whatever the tab, so the tab row does not
        jump sideways when the full-bleed dashboard is selected.
      -->
      <div class="mx-auto w-full max-w-screen-2xl px-6 pt-4">
        <h1 class="mb-3 font-semibold text-slate-900">Hevy Personal Dashboard</h1>
        <AppTabs />
      </div>
    </header>

    <main
      :id="`panel-${tab}`"
      role="tabpanel"
      :aria-labelledby="`tab-${tab}`"
      :class="isFullWidth ? 'w-full py-4' : 'mx-auto w-full max-w-4xl p-6'"
    >
      <RouterView />
    </main>
  </div>
</template>
