<script setup lang="ts">
import { t } from '@/i18n';
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import AuthError from '@/components/auth/AuthError.vue';
import AuthField from '@/components/auth/AuthField.vue';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import OAuthButtons from '@/components/auth/OAuthButtons.vue';
import { useAuth, type OAuthProvider } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { errorMessage, isEmail, safeRedirect } from '@/utils/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuth();

const form = reactive({ email: '', password: '', remember: true });
const touched = reactive({ email: false, password: false });
const submitted = ref(false);
const formError = ref<string | null>(null);

onMounted(() => {
  if (route.query.reason !== 'expired') {
    return;
  }
  useToasts().push({ tone: 'warning', title: t('auth.signIn.sessionEnded'), description: t('auth.signIn.signInAgain') });
  const { reason: _reason, ...rest } = route.query;
  void router.replace({ query: rest });
});

function enterApp(): void {
  void router.replace(safeRedirect(route.query.redirect) ?? { name: 'home' });
}

const errors = computed(() => ({
  email: (touched.email || submitted.value) && !isEmail(form.email) ? t('validation.email') : null,
  password: (touched.password || submitted.value) && !form.password ? t('auth.signIn.passwordRequired') : null,
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
  } catch (error_) {
    formError.value = errorMessage(error_);
  }
}

async function withProvider(provider: OAuthProvider): Promise<void> {
  formError.value = null;
  try {
    await auth.signInWith(provider);
    enterApp();
  } catch (error_) {
    formError.value = errorMessage(error_);
  }
}
</script>

<template>
  <AuthLayout :title="t('auth.signIn.title')" :subtitle="t('auth.signIn.subtitle')">
    <AuthError :message="formError" />
    <OAuthButtons :action="t('auth.signIn.continue')" :pending="auth.pendingProvider.value" :disabled="busy" @select="withProvider" />

    <div class="flex items-center gap-3 text-xs text-zinc-600">
      <hr class="flex-1 border-zinc-800" />
      {{ t('auth.orWithEmail') }}
      <hr class="flex-1 border-zinc-800" />
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <auth-field
        id="signin-email"
        v-model="form.email"
        :label="t('auth.email')"
        type="email"
        autocomplete="email"
        :error="errors.email"
        @blur="touched.email = true"
      />
      <auth-field
        id="signin-password"
        v-model="form.password"
        :label="t('auth.password')"
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
            {{ t('auth.signIn.forgot') }}
          </RouterLink>
        </template>
      </auth-field>

      <label class="flex items-center gap-2 text-xs text-zinc-400">
        <input v-model="form.remember" type="checkbox" class="h-3.5 w-3.5 accent-blue-600" />
        {{ t('auth.signIn.remember') }}
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
        {{ t('auth.signIn.submit') }}
      </button>
    </form>

    <p class="text-center text-sm text-zinc-500">
      {{ t('auth.signIn.newHere') }}
      <RouterLink
        :to="{ name: 'sign-up' }"
        class="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:decoration-zinc-300"
      >
        {{ t('auth.signIn.createAccount') }}
      </RouterLink>
    </p>
  </AuthLayout>
</template>
