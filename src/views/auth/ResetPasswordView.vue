<script setup lang="ts">
import { CircleCheck, TriangleAlert } from 'lucide-vue-next';
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter.vue';
import { useAuth } from '@/composables/useAuth';
import { passwordProblem } from '@/utils/auth';

type Stage = 'form' | 'done' | 'invalid';

const route = useRoute();
const auth = useAuth();

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));

const form = reactive({ password: '', confirm: '' });
const touched = reactive({ password: false, confirm: false });
const submitted = ref(false);
const stage = ref<Stage>(token.value ? 'form' : 'invalid');

const errors = computed(() => ({
  password: (touched.password || submitted.value) ? passwordProblem(form.password) : null,
  confirm:
    (touched.confirm || submitted.value) && form.confirm !== form.password ? 'The two passwords do not match.' : null,
}));

async function submit(): Promise<void> {
  submitted.value = true;
  if (passwordProblem(form.password) !== null || form.confirm !== form.password) {
    return;
  }
  stage.value = (await auth.resetPassword(token.value, form.password)) ? 'done' : 'invalid';
}

const TITLES: Record<Stage, { title: string; subtitle: string }> = {
  form: { title: 'Choose a new password', subtitle: 'You will use it the next time you sign in.' },
  done: { title: 'Password updated', subtitle: 'Your new password is ready to use.' },
  invalid: { title: 'This link does not work', subtitle: 'Reset links expire after 30 minutes and can be used once.' },
};

const primary =
  'inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60';
</script>

<template>
  <AuthLayout :title="TITLES[stage].title" :subtitle="TITLES[stage].subtitle">
    <form v-if="stage === 'form'" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthField
        id="reset-password"
        v-model="form.password"
        label="New password"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
        hint="At least 8 characters, mixing letters, digits or symbols."
        @blur="touched.password = true"
      >
        <PasswordStrengthMeter :password="form.password" />
      </AuthField>
      <AuthField
        id="reset-confirm"
        v-model="form.confirm"
        label="Confirm new password"
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
        Update password
      </button>
    </form>

    <div v-else-if="stage === 'done'" class="flex flex-col gap-4">
      <div class="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4" role="status">
        <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <p class="text-sm text-zinc-200">You were signed out everywhere else. Sign in again with your new password.</p>
      </div>
      <RouterLink :to="{ name: 'sign-in' }" :class="primary">Go to sign in</RouterLink>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-4" role="alert">
        <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        <p class="text-sm text-zinc-200">Ask for a new link and use it within 30 minutes.</p>
      </div>
      <RouterLink :to="{ name: 'forgot-password' }" :class="primary">Request a new link</RouterLink>
      <RouterLink
        :to="{ name: 'sign-in' }"
        class="text-center text-xs font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-200"
      >
        Back to sign in
      </RouterLink>
    </div>
  </AuthLayout>
</template>
