<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import OAuthButtons from '@/components/auth/OAuthButtons.vue';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter.vue';
import { useAuth, type OAuthProvider } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { isEmail, passwordProblem } from '@/utils/auth';

const router = useRouter();
const auth = useAuth();
const { push } = useToasts();

const form = reactive({ name: '', email: '', password: '', terms: false });
const touched = reactive({ name: false, email: false, password: false });
const submitted = ref(false);

const errors = computed(() => ({
  name: (touched.name || submitted.value) && !form.name.trim() ? 'Tell us what to call you.' : null,
  email: (touched.email || submitted.value) && !isEmail(form.email) ? 'Enter a valid email address.' : null,
  password: (touched.password || submitted.value) ? passwordProblem(form.password) : null,
  terms: submitted.value && !form.terms ? 'Accept the terms to create an account.' : null,
}));

const isValid = computed(
  () => form.name.trim() !== '' && isEmail(form.email) && passwordProblem(form.password) === null && form.terms,
);

const busy = computed(() => auth.isSubmitting.value);

async function submit(): Promise<void> {
  submitted.value = true;
  if (!isValid.value) {
    return;
  }
  await auth.signUp(form.name.trim(), form.email.trim(), form.password);
  push({ tone: 'success', title: 'Account created', description: 'Demo mode: nothing was sent to a server.' });
  void router.push({ name: 'home', query: { tab: 'settings' } });
}

async function withProvider(provider: OAuthProvider): Promise<void> {
  await auth.signInWith(provider);
  void router.push({ name: 'home', query: { tab: 'settings' } });
}
</script>

<template>
  <AuthLayout title="Create your account" subtitle="Keep your Hevy history, profile and trophies in one place.">
    <OAuthButtons action="Sign up" :pending="auth.pendingProvider.value" :disabled="busy" @select="withProvider" />

    <div class="flex items-center gap-3 text-xs text-zinc-600" role="separator">
      <span class="h-px flex-1 bg-zinc-800" />
      or with your email
      <span class="h-px flex-1 bg-zinc-800" />
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthField
        id="signup-name"
        v-model="form.name"
        label="Name"
        autocomplete="name"
        :error="errors.name"
        @blur="touched.name = true"
      />
      <AuthField
        id="signup-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="errors.email"
        @blur="touched.email = true"
      />
      <AuthField
        id="signup-password"
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
        hint="At least 8 characters, mixing letters, digits or symbols."
        @blur="touched.password = true"
      >
        <PasswordStrengthMeter :password="form.password" />
      </AuthField>

      <div class="flex flex-col gap-1">
        <label class="flex items-start gap-2 text-xs text-zinc-400">
          <input
            v-model="form.terms"
            type="checkbox"
            class="mt-0.5 h-3.5 w-3.5 accent-blue-600"
            :aria-invalid="Boolean(errors.terms)"
            aria-describedby="signup-terms-help"
          />
          I accept the terms of use and the privacy policy.
        </label>
        <p v-if="errors.terms" id="signup-terms-help" class="text-xs text-red-400">{{ errors.terms }}</p>
      </div>

      <button
        type="submit"
        class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="busy"
        :aria-busy="busy && !auth.pendingProvider.value"
      >
        <span
          v-if="busy && !auth.pendingProvider.value"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
          aria-hidden="true"
        />
        Create account
      </button>
    </form>

    <p class="text-center text-sm text-zinc-500">
      Already have an account?
      <RouterLink
        :to="{ name: 'sign-in' }"
        class="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
      >
        Sign in
      </RouterLink>
    </p>
  </AuthLayout>
</template>
