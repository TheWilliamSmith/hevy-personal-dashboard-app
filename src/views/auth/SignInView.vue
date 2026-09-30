<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import AuthError from '@/components/auth/AuthError.vue';
import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import OAuthButtons from '@/components/auth/OAuthButtons.vue';
import { useAuth, type OAuthProvider } from '@/composables/useAuth';
import { errorMessage, isEmail, safeRedirect } from '@/utils/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuth();

const form = reactive({ email: '', password: '', remember: true });
const touched = reactive({ email: false, password: false });
const submitted = ref(false);
const formError = ref<string | null>(null);

function enterApp(): void {
  void router.replace(safeRedirect(route.query.redirect) ?? { name: 'home' });
}

const errors = computed(() => ({
  email: (touched.email || submitted.value) && !isEmail(form.email) ? 'Enter a valid email address.' : null,
  password: (touched.password || submitted.value) && !form.password ? 'Enter your password.' : null,
}));

const busy = computed(() => auth.isSubmitting.value);

async function submit(): Promise<void> {
  submitted.value = true;
  formError.value = null;
  if (!isEmail(form.email) || !form.password) {
    return;
  }
  try {
    await auth.signIn(form.email.trim(), form.password, form.remember);
    enterApp();
  } catch (caught) {
    formError.value = errorMessage(caught);
  }
}

async function withProvider(provider: OAuthProvider): Promise<void> {
  formError.value = null;
  try {
    await auth.signInWith(provider);
    enterApp();
  } catch (caught) {
    formError.value = errorMessage(caught);
  }
}
</script>

<template>
  <AuthLayout title="Welcome back" subtitle="Sign in to see your training dashboard.">
    <AuthError :message="formError" />
    <OAuthButtons action="Continue" :pending="auth.pendingProvider.value" :disabled="busy" @select="withProvider" />

    <div class="flex items-center gap-3 text-xs text-zinc-600" role="separator">
      <span class="h-px flex-1 bg-zinc-800" />
      or with your email
      <span class="h-px flex-1 bg-zinc-800" />
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthField
        id="signin-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="errors.email"
        @blur="touched.email = true"
      />
      <AuthField
        id="signin-password"
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
        @blur="touched.password = true"
      >
        <template #aside>
          <RouterLink
            :to="{ name: 'forgot-password', query: form.email ? { email: form.email } : {} }"
            class="text-xs font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
          >
            Forgot password?
          </RouterLink>
        </template>
      </AuthField>

      <label class="flex items-center gap-2 text-xs text-zinc-400">
        <input v-model="form.remember" type="checkbox" class="h-3.5 w-3.5 accent-blue-600" />
        Keep me signed in on this device
      </label>

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
        Sign in
      </button>
    </form>

    <p class="text-center text-sm text-zinc-500">
      New here?
      <RouterLink
        :to="{ name: 'sign-up' }"
        class="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
      >
        Create an account
      </RouterLink>
    </p>
  </AuthLayout>
</template>
