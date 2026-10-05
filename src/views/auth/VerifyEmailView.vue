<script setup lang="ts">
import { CircleCheck, TriangleAlert } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import AuthLayout from '@/components/auth/AuthLayout.vue';
import { useAuth } from '@/composables/useAuth';
import { t } from '@/i18n';
import { ApiError } from '@/lib/api';

type Stage = 'working' | 'done' | 'taken' | 'invalid';

const route = useRoute();
const auth = useAuth();
const stage = ref<Stage>('working');
const email = ref('');

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));

onMounted(async () => {
  if (!token.value) {
    stage.value = 'invalid';
    return;
  }
  try {
    email.value = (await auth.verifyEmail(token.value)).email;
    stage.value = 'done';
  } catch (error_) {
    stage.value = error_ instanceof ApiError && error_.status === 409 ? 'taken' : 'invalid';
  }
});

const title = computed(() => {
  switch (stage.value) {
    case 'done':
      return t('auth.verify.doneTitle');
    case 'working':
      return t('auth.verify.title');
    default:
      return t('auth.verify.invalidTitle');
  }
});

const primary =
  'inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
</script>

<template>
  <AuthLayout :title="title" :subtitle="t('auth.verify.subtitle')">
    <output v-if="stage === 'working'" class="block text-sm text-zinc-400">{{ t('auth.verify.working') }}</output>

    <template v-else>
      <output
        v-if="stage === 'done'"
        class="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4"
      >
        <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <span class="text-sm text-zinc-200">{{ t('auth.verify.done', { email }) }}</span>
      </output>
      <div v-else class="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-4" role="alert">
        <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        <p class="text-sm text-zinc-200">{{ stage === 'taken' ? t('auth.verify.taken') : t('auth.verify.invalid') }}</p>
      </div>
      <RouterLink :to="auth.isAuthenticated.value ? { name: 'home' } : { name: 'sign-in' }" :class="primary">
        {{ auth.isAuthenticated.value ? t('auth.verify.openDashboard') : t('auth.verify.signIn') }}
      </RouterLink>
    </template>
  </AuthLayout>
</template>
