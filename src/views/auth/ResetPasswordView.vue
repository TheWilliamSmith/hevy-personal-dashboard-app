<script setup lang="ts">
import { t } from '@/i18n';
import { CircleCheck, TriangleAlert } from 'lucide-vue-next';
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import AuthError from '@/components/auth/AuthError.vue';
import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter.vue';
import { useAuth } from '@/composables/useAuth';
import { errorMessage, passwordProblem } from '@/utils/auth';

type Stage = 'form' | 'done' | 'invalid';

const route = useRoute();
const auth = useAuth();

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));

const form = reactive({ password: '', confirm: '' });
const touched = reactive({ password: false, confirm: false });
const submitted = ref(false);
const formError = ref<string | null>(null);
const stage = ref<Stage>(token.value ? 'form' : 'invalid');

const errors = computed(() => ({
  password: (touched.password || submitted.value) ? passwordProblem(form.password) : null,
  confirm:
    (touched.confirm || submitted.value) && form.confirm !== form.password ? t('auth.reset.mismatch') : null,
}));

async function submit(): Promise<void> {
  submitted.value = true;
  formError.value = null;
  if (passwordProblem(form.password) !== null || form.confirm !== form.password) {
    return;
  }
  try {
    stage.value = (await auth.resetPassword(token.value, form.password)) ? 'done' : 'invalid';
  } catch (error_) {
    formError.value = errorMessage(error_);
  }
}

const TITLES: Record<Stage, { title: string; subtitle: string }> = {
  form: { title: 'auth.reset.formTitle', subtitle: 'auth.reset.formSubtitle' },
  done: { title: 'auth.reset.doneTitle', subtitle: 'auth.reset.doneSubtitle' },
  invalid: { title: 'auth.reset.invalidTitle', subtitle: 'auth.reset.invalidSubtitle' },
};

const primary =
  'inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60';
</script>

<template>
  <AuthLayout :title="t(TITLES[stage].title)" :subtitle="t(TITLES[stage].subtitle)">
    <form v-if="stage === 'form'" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthError :message="formError" />
      <AuthField
        id="reset-password"
        v-model="form.password"
        :label="t('auth.reset.newPassword')"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
        :hint="t('auth.passwordHint')"
        @blur="touched.password = true"
      >
        <PasswordStrengthMeter :password="form.password" />
      </AuthField>
      <AuthField
        id="reset-confirm"
        v-model="form.confirm"
        :label="t('auth.reset.confirmPassword')"
        type="password"
        autocomplete="new-password"
        :error="errors.confirm"
        @blur="touched.confirm = true"
      />
      <button
        type="submit"
        :class="[primary, 'mt-2']"
        :disabled="auth.isSubmitting.value"
        :aria-busy="auth.isSubmitting.value"
      >
        <span
          v-if="auth.isSubmitting.value"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
          aria-hidden="true"
        />
        {{ t('auth.reset.submit') }}
      </button>
    </form>

    <div v-else-if="stage === 'done'" class="flex flex-col gap-4">
      <output class="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4">
        <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <span class="text-sm text-zinc-200">{{ t('auth.reset.signedOut') }}</span>
      </output>
      <RouterLink :to="{ name: 'sign-in' }" :class="primary">{{ t('auth.reset.goToSignIn') }}</RouterLink>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-4" role="alert">
        <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        <p class="text-sm text-zinc-200">{{ t('auth.reset.askNewLink') }}</p>
      </div>
      <RouterLink :to="{ name: 'forgot-password' }" :class="primary">{{ t('auth.reset.requestNewLink') }}</RouterLink>
      <RouterLink
        :to="{ name: 'sign-in' }"
        class="text-center text-xs font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-200"
      >
        {{ t('auth.backToSignIn') }}
      </RouterLink>
    </div>
  </AuthLayout>
</template>
