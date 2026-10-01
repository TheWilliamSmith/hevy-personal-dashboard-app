<script setup lang="ts">
import { t } from '@/i18n';
import { ChevronLeft, MailCheck } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import AuthError from '@/components/auth/AuthError.vue';
import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import { useAuth } from '@/composables/useAuth';
import { errorMessage, isEmail } from '@/utils/auth';

const route = useRoute();
const auth = useAuth();

const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const touched = ref(false);
const sentTo = ref<string | null>(null);
const formError = ref<string | null>(null);

const error = computed(() => (touched.value && !isEmail(email.value) ? t('validation.email') : null));

async function submit(): Promise<void> {
  touched.value = true;
  formError.value = null;
  if (!isEmail(email.value)) {
    return;
  }
  try {
    await auth.requestPasswordReset(email.value.trim());
    sentTo.value = email.value.trim();
  } catch (caught) {
    formError.value = errorMessage(caught);
  }
}
</script>

<template>
  <AuthLayout
    :title="sentTo ? t('auth.forgot.sentTitle') : t('auth.forgot.title')"
    :subtitle="sentTo ? t('auth.forgot.sentSubtitle') : t('auth.forgot.subtitle')"
  >
    <div v-if="sentTo" class="flex flex-col gap-4">
      <div class="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4">
        <MailCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <i18n-t keypath="auth.forgot.sentBody" tag="p" scope="global" class="text-sm text-zinc-200" role="status">
          <template #email>
            <span class="font-medium text-white">{{ sentTo }}</span>
          </template>
        </i18n-t>
      </div>
      <i18n-t keypath="auth.forgot.nothingArrived" tag="p" scope="global" class="text-xs text-zinc-500">
        <template #action>
          <button
            type="button"
            class="font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
            @click="sentTo = null"
          >
            {{ t('auth.forgot.tryAnother') }}
          </button>
        </template>
      </i18n-t>
    </div>

    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthError :message="formError" />
      <AuthField
        id="forgot-email"
        v-model="email"
        :label="t('auth.email')"
        type="email"
        autocomplete="email"
        :error="error"
        @blur="touched = true"
      />
      <button
        type="submit"
        class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="auth.isSubmitting.value"
        :aria-busy="auth.isSubmitting.value"
      >
        <span
          v-if="auth.isSubmitting.value"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
          aria-hidden="true"
        />
        {{ t('auth.forgot.submit') }}
      </button>
    </form>

    <RouterLink
      :to="{ name: 'sign-in' }"
      class="-ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
    >
      <ChevronLeft class="h-4 w-4" aria-hidden="true" />
      {{ t('auth.backToSignIn') }}
    </RouterLink>
  </AuthLayout>
</template>
