<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import AuthError from '@/components/auth/AuthError.vue';
import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import OAuthButtons from '@/components/auth/OAuthButtons.vue';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter.vue';
import { useAuth, type OAuthProvider } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { ApiError } from '@/lib/api';
import { errorMessage, isEmail, passwordProblem } from '@/utils/auth';
import { isUsername, normalizeUsername, suggestUsername } from '@/utils/profile';

const router = useRouter();
const auth = useAuth();
const { push } = useToasts();

type TakenField = 'email' | 'username';

const form = reactive({ displayName: '', username: '', email: '', password: '', terms: false });
const touched = reactive({ displayName: false, username: false, email: false, password: false });
const submitted = ref(false);
const formError = ref<string | null>(null);
const usernameEdited = ref(false);
const taken = reactive<Record<TakenField, string | null>>({ email: null, username: null });

watch(
  () => form.displayName,
  (displayName) => {
    if (!usernameEdited.value) {
      form.username = suggestUsername(displayName);
    }
  },
);

function editUsername(value: string): void {
  usernameEdited.value = true;
  form.username = value;
}

const normalized = computed(() => ({
  email: form.email.trim().toLowerCase(),
  username: normalizeUsername(form.username),
}));

const errors = computed(() => ({
  displayName:
    (touched.displayName || submitted.value) && !form.displayName.trim() ? 'Tell us what to call you.' : null,
  username:
    taken.username !== null && taken.username === normalized.value.username
      ? 'This username is already taken.'
      : (touched.username || submitted.value) && !isUsername(form.username)
        ? 'Use 3 to 30 lowercase letters, digits, dots or underscores.'
        : null,
  email:
    taken.email !== null && taken.email === normalized.value.email
      ? 'An account already exists for this email.'
      : (touched.email || submitted.value) && !isEmail(form.email)
        ? 'Enter a valid email address.'
        : null,
  password: (touched.password || submitted.value) ? passwordProblem(form.password) : null,
  terms: submitted.value && !form.terms ? 'Accept the terms to create an account.' : null,
}));

const isValid = computed(
  () =>
    form.displayName.trim() !== '' &&
    isUsername(form.username) &&
    isEmail(form.email) &&
    passwordProblem(form.password) === null &&
    form.terms,
);

function takenField(caught: unknown): TakenField | null {
  if (!(caught instanceof ApiError) || caught.status !== 409) {
    return null;
  }
  const { field } = (caught.body ?? {}) as { field?: unknown };
  return field === 'username' ? 'username' : 'email';
}

const busy = computed(() => auth.isSubmitting.value);

async function submit(): Promise<void> {
  submitted.value = true;
  formError.value = null;
  if (!isValid.value) {
    return;
  }
  try {
    await auth.signUp({
      displayName: form.displayName.trim(),
      username: normalized.value.username,
      email: normalized.value.email,
      password: form.password,
    });
    push({ tone: 'success', title: 'Account created', description: `Welcome, ${form.displayName.trim()}.` });
    void router.replace({ name: 'home', query: { tab: 'settings' } });
  } catch (caught) {
    const field = takenField(caught);
    if (field) {
      taken[field] = normalized.value[field];
      return;
    }
    formError.value = errorMessage(caught);
  }
}

async function withProvider(provider: OAuthProvider): Promise<void> {
  formError.value = null;
  try {
    await auth.signInWith(provider);
    void router.replace({ name: 'home', query: { tab: 'settings' } });
  } catch (caught) {
    formError.value = errorMessage(caught);
  }
}
</script>

<template>
  <AuthLayout title="Create your account" subtitle="Keep your Hevy history, profile and trophies in one place.">
    <AuthError :message="formError" />
    <OAuthButtons action="Sign up" :pending="auth.pendingProvider.value" :disabled="busy" @select="withProvider" />

    <div class="flex items-center gap-3 text-xs text-zinc-600" role="separator">
      <span class="h-px flex-1 bg-zinc-800" />
      or with your email
      <span class="h-px flex-1 bg-zinc-800" />
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthField
        id="signup-display-name"
        v-model="form.displayName"
        label="Display name"
        autocomplete="name"
        :maxlength="80"
        :error="errors.displayName"
        @blur="touched.displayName = true"
      />
      <AuthField
        id="signup-username"
        :model-value="form.username"
        label="Username"
        prefix="@"
        autocomplete="username"
        :maxlength="30"
        :error="errors.username"
        hint="3 to 30 characters: lowercase letters, digits, dots and underscores."
        @update:model-value="editUsername"
        @blur="touched.username = true"
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
