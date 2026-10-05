<script setup lang="ts">
import { t } from '@/i18n';
import { computed, reactive, ref } from 'vue';

import AuthError from '@/components/auth/AuthError.vue';
import AuthField from '@/components/auth/AuthField.vue';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import { useAuth } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { ApiError } from '@/lib/api';
import { errorMessage, isEmail, passwordProblem } from '@/utils/auth';

const emit = defineEmits<{ signOut: [] }>();

const auth = useAuth();
const { push } = useToasts();

type Pending = 'email' | 'password' | 'resend' | 'cancel' | null;
const pending = ref<Pending>(null);

function fieldOf(error_: unknown): string | null {
  if (!(error_ instanceof ApiError)) {
    return null;
  }
  const { field } = (error_.body ?? {}) as { field?: unknown };
  return typeof field === 'string' ? field : null;
}

const password = reactive({ current: '', next: '', confirm: '' });
const passwordSubmitted = ref(false);
const passwordServer = reactive<{ current: string | null; next: string | null; form: string | null }>({
  current: null,
  next: null,
  form: null,
});

const passwordErrors = computed(() => ({
  current: passwordServer.current ?? (passwordSubmitted.value && !password.current ? t('security.currentPasswordRequired') : null),
  next: passwordServer.next ?? (passwordSubmitted.value ? passwordProblem(password.next) : null),
  confirm:
    passwordSubmitted.value && password.confirm !== password.next ? t('auth.reset.mismatch') : null,
}));

async function changePassword(): Promise<void> {
  passwordSubmitted.value = true;
  Object.assign(passwordServer, { current: null, next: null, form: null });
  if (!password.current || passwordProblem(password.next) !== null || password.confirm !== password.next) {
    return;
  }
  pending.value = 'password';
  try {
    await auth.changePassword(password.current, password.next);
    Object.assign(password, { current: '', next: '', confirm: '' });
    passwordSubmitted.value = false;
    push({
      tone: 'success',
      title: t('security.passwordChanged'),
      description: t('security.passwordChangedDescription'),
    });
  } catch (error_) {
    const field = fieldOf(error_);
    if (field === 'currentPassword') {
      passwordServer.current = errorMessage(error_);
    } else if (field === 'newPassword') {
      passwordServer.next = errorMessage(error_);
    } else {
      passwordServer.form = errorMessage(error_);
    }
  } finally {
    pending.value = null;
  }
}

const email = reactive({ next: '', current: '' });
const emailSubmitted = ref(false);
const emailServer = reactive<{ next: string | null; current: string | null; form: string | null }>({
  next: null,
  current: null,
  form: null,
});

const emailErrors = computed(() => ({
  next: emailServer.next ?? (emailSubmitted.value && !isEmail(email.next) ? t('validation.email') : null),
  current: emailServer.current ?? (emailSubmitted.value && !email.current ? t('security.currentPasswordRequired') : null),
}));

async function resendLink(): Promise<void> {
  pending.value = 'resend';
  try {
    push({ tone: 'success', title: t('security.linkSent', { email: await auth.resendVerification() }) });
  } catch (error_) {
    push({ tone: 'error', title: t('security.actionFailed'), description: errorMessage(error_) });
  } finally {
    pending.value = null;
  }
}

async function cancelChange(): Promise<void> {
  pending.value = 'cancel';
  try {
    await auth.cancelEmailChange();
    push({ tone: 'success', title: t('security.changeCancelled') });
  } catch (error_) {
    push({ tone: 'error', title: t('security.actionFailed'), description: errorMessage(error_) });
  } finally {
    pending.value = null;
  }
}

async function changeEmail(): Promise<void> {
  emailSubmitted.value = true;
  Object.assign(emailServer, { next: null, current: null, form: null });
  if (!isEmail(email.next) || !email.current) {
    return;
  }
  pending.value = 'email';
  try {
    const requested = email.next.trim().toLowerCase();
    await auth.changeEmail(requested, email.current);
    Object.assign(email, { next: '', current: '' });
    emailSubmitted.value = false;
    push({ tone: 'success', title: t('security.emailChanged'), description: t('security.emailChangedDescription', { email: requested }) });
  } catch (error_) {
    const field = fieldOf(error_);
    if (field === 'email') {
      emailServer.next = errorMessage(error_);
    } else if (field === 'currentPassword') {
      emailServer.current = errorMessage(error_);
    } else {
      emailServer.form = errorMessage(error_);
    }
  } finally {
    pending.value = null;
  }
}

const primary =
  'inline-flex items-center gap-2 self-start rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50';
const secondary =
  'rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:opacity-50';
const spinner = 'h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900';
</script>

<template>
  <div class="flex flex-col gap-8">
    <form class="flex max-w-3xl flex-col gap-5" novalidate @submit.prevent="changeEmail">
      <SectionHeader :title="t('security.emailTitle')" :subtitle="t('security.emailSubtitle')" />
      <AuthError :message="emailServer.form" />
      <div>
        <p class="text-xs text-zinc-400">{{ t('security.currentEmail') }}</p>
        <p class="mt-1.5 flex items-center gap-2 text-sm font-medium text-zinc-100">
          <span class="truncate">{{ auth.user.value?.email }}</span>
          <span
            v-if="auth.user.value && !auth.user.value.emailVerified"
            class="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400"
          >
            {{ t('security.notConfirmed') }}
          </span>
        </p>
      </div>
      <div v-if="auth.user.value?.pendingEmail" class="flex flex-wrap items-center gap-3 rounded-md border border-blue-500/40 bg-blue-500/10 p-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-zinc-100">{{ t('security.pendingEmail', { email: auth.user.value.pendingEmail }) }}</p>
          <p class="mt-0.5 text-xs text-zinc-400">{{ t('security.pendingHint') }}</p>
        </div>
        <button type="button" :class="secondary" :disabled="pending !== null" @click="resendLink">{{ t('security.resendLink') }}</button>
        <button type="button" :class="secondary" :disabled="pending !== null" @click="cancelChange">{{ t('security.cancelChange') }}</button>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <auth-field
          id="security-new-email"
          v-model="email.next"
          :label="t('security.newEmail')"
          type="email"
          autocomplete="email"
          :error="emailErrors.next"
        />
        <auth-field
          id="security-email-password"
          v-model="email.current"
          :label="t('security.currentPassword')"
          type="password"
          autocomplete="current-password"
          :error="emailErrors.current"
        />
      </div>
      <button type="submit" :class="primary" :disabled="pending !== null" :aria-busy="pending === 'email'">
        <span v-if="pending === 'email'" :class="spinner" aria-hidden="true" />
        {{ t('security.changeEmail') }}
      </button>
    </form>

    <form class="flex max-w-3xl flex-col gap-5 border-t border-zinc-800 pt-8" novalidate @submit.prevent="changePassword">
      <SectionHeader :title="t('security.passwordTitle')" :subtitle="t('security.passwordSubtitle')" />
      <AuthError :message="passwordServer.form" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <auth-field
          id="security-current-password"
          v-model="password.current"
          :label="t('security.currentPassword')"
          type="password"
          autocomplete="current-password"
          :error="passwordErrors.current"
        />
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <auth-field
          id="security-new-password"
          v-model="password.next"
          :label="t('auth.reset.newPassword')"
          type="password"
          autocomplete="new-password"
          :error="passwordErrors.next"
          :hint="t('auth.passwordHint')"
        >
          <PasswordStrengthMeter :password="password.next" />
        </auth-field>
        <auth-field
          id="security-confirm-password"
          v-model="password.confirm"
          :label="t('auth.reset.confirmPassword')"
          type="password"
          autocomplete="new-password"
          :error="passwordErrors.confirm"
        />
      </div>
      <button type="submit" :class="primary" :disabled="pending !== null" :aria-busy="pending === 'password'">
        <span v-if="pending === 'password'" :class="spinner" aria-hidden="true" />
        {{ t('security.changePassword') }}
      </button>
    </form>

    <div class="flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-5">
      <p class="text-xs text-zinc-500">{{ t('security.forgotHint') }}</p>
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-zinc-800 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        @click="emit('signOut')"
      >
        {{ t('security.signOut') }}
      </button>
    </div>
  </div>
</template>
