<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppTopBar from '@/components/layout/AppTopBar.vue';
import ToastStack from '@/components/ui/ToastStack.vue';
import { useActiveTab } from '@/composables/useActiveTab';
import { useAuth } from '@/composables/useAuth';
import { useCelebrations } from '@/composables/useCelebrations';

const CelebrationModal = defineAsyncComponent(
  () => import('@/components/achievements/CelebrationModal.vue'),
);

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const { tab } = useActiveTab();
const celebrations = useCelebrations();

const isAuthLayout = computed(() => route.meta.layout === 'auth');

const content = ref<HTMLElement | null>(null);

watch(
  () => [route.query.tab, route.query.workout, route.query.exercise],
  () => content.value?.scrollTo({ top: 0 }),
);

async function checkSession(): Promise<void> {
  await auth.restore();
  if (!auth.isAuthenticated.value && !isAuthLayout.value) {
    void router.replace({ name: 'sign-in', query: { redirect: route.fullPath } });
  }
}

watch(
  auth.isAuthenticated,
  (signedIn) => {
    if (signedIn) {
      void celebrations.loadUnseen();
    }
  },
  { immediate: true },
);

onMounted(() => void checkSession());
</script>

<template>
  <div v-if="isAuthLayout" class="h-dvh overflow-hidden">
    <RouterView />
    <ToastStack />
  </div>

  <div v-else class="flex h-dvh overflow-hidden bg-zinc-950">
    <AppSidebar />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <AppTopBar />

      <main
        :id="`panel-${tab}`"
        ref="content"
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <RouterView />
      </main>
    </div>

    <ToastStack />
    <CelebrationModal v-if="celebrations.remaining.value > 0" />
  </div>
</template>
