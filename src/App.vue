<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue';
import { RouterView } from 'vue-router';

import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppTopBar from '@/components/layout/AppTopBar.vue';
import ToastStack from '@/components/ui/ToastStack.vue';
import { useActiveTab } from '@/composables/useActiveTab';
import { useCelebrations } from '@/composables/useCelebrations';

const CelebrationModal = defineAsyncComponent(
  () => import('@/components/achievements/CelebrationModal.vue'),
);

const { tab, isFullWidth } = useActiveTab();
const celebrations = useCelebrations();

onMounted(() => void celebrations.loadUnseen());
</script>

<template>
  <div class="flex min-h-screen bg-slate-100">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopBar />

      <main
        :id="`panel-${tab}`"
        :class="isFullWidth ? 'w-full py-4' : 'mx-auto w-full max-w-4xl p-6'"
      >
        <RouterView />
      </main>
    </div>

    <ToastStack />
    <CelebrationModal v-if="celebrations.remaining.value > 0" />
  </div>
</template>
