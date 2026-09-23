<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppTabs from '@/components/AppTabs.vue';
import ToastStack from '@/components/ui/ToastStack.vue';
import { useActiveTab } from '@/composables/useActiveTab';

const { tab, isFullWidth } = useActiveTab();
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="border-b border-slate-200 bg-white">
      <!--
        Full width like the tabs below it. The horizontal padding matches the
        full-bleed views (px-4 / sm:px-6) so the title and tabs line up with
        the page content.
      -->
      <div class="w-full px-4 pt-4 sm:px-6">
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

    <ToastStack />
  </div>
</template>
