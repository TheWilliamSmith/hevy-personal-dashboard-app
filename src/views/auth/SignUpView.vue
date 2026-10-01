<script setup lang="ts">
import { t } from '@/i18n';
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
    (touched.displayName || submitted.value) && !form.displayName.trim() ? t('auth.signUp.displayNameRequired') : null,
  username:
    taken.username !== null && taken.username === normalized.value.username
      ? t('auth.signUp.usernameTaken')
      : (touched.username || submitted.value) && !isUsername(form.username)
        ? t('auth.signUp.usernameInvalid')
        : null,
  email:
    taken.email !== null && taken.email === normalized.value.email
      ? t('auth.signUp.emailTaken')
      : (touched.email || submitted.value) && !isEmail(form.email)
        ? t('validation.email')
        : null,
  password: (touched.password || submitted.value) ? passwordProblem(form.password) : null,
  terms: submitted.value && !form.terms ? t('auth.signUp.termsRequired') : null,
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
    push({
      tone: 'success',
      title: t('auth.signUp.created'),
      description: t('auth.signUp.welcome', { name: form.displayName.trim() }),
    });
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
  <AuthLayout :title="t('auth.signUp.title')" :subtitle="t('auth.signUp.subtitle')">
    <AuthError :message="formError" />
    <OAuthButtons :action="t('auth.signUp.action')" :pending="auth.pendingProvider.value" :disabled="busy" @select="withProvider" />

    <div class="flex items-center gap-3 text-xs text-zinc-600" role="separator">
      <span class="h-px flex-1 bg-zinc-800" />
      {{ t('auth.orWithEmail') }}
      <span class="h-px flex-1 bg-zinc-800" />
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AuthField
        id="signup-display-name"
        v-model="form.displayName"
        :label="t('auth.signUp.displayName')"
        autocomplete="name"
        :maxlength="80"
        :error="errors.displayName"
        @blur="touched.displayName = true"
      />
      <AuthField
        id="signup-username"
        :model-value="form.username"
        :label="t('auth.signUp.username')"
        prefix="@"
        autocomplete="username"
        :maxlength="30"
        :error="errors.username"
        :hint="t('auth.signUp.usernameHint')"
        @update:model-value="editUsername"
        @blur="touched.username = true"
      />
      <AuthField
        id="signup-email"
        v-model="form.email"
        :label="t('auth.email')"
        type="email"
        autocomplete="email"
        :error="errors.email"
        @blur="touched.email = true"
      />
      <AuthField
        id="signup-password"
        v-model="form.password"
        :label="t('auth.password')"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
        :hint="t('auth.passwordHint')"
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
          {{ t('auth.signUp.terms') }}
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
        {{ t('auth.signUp.submit') }}
      </button>
    </form>

    <p class="text-center text-sm text-zinc-500">
      {{ t('auth.signUp.haveAccount') }}
      <RouterLink
        :to="{ name: 'sign-in' }"
        class="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
      >
        {{ t('auth.signUp.signIn') }}
      </RouterLink>
    </p>
  </AuthLayout>
</template>
