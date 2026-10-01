import { t } from '@/i18n';
import { computed, readonly, ref, type ComputedRef, type DeepReadonly, type Ref } from 'vue';

import { ApiError, apiGet, apiPatch, apiPost } from '@/lib/api';
import { clearSession, isRememberedSession, loadSession, saveSession } from '@/lib/auth-session';
import type { AuthSession, AuthUser } from '@/types/auth';

export type OAuthProvider = 'google' | 'apple';

export interface SignUpInput {
  displayName: string;
  username: string;
  email: string;
  password: string;
}

const DEMO_DELAY_MS = 600;

const user = ref<AuthUser | null>(loadSession()?.user ?? null);
const isSubmitting = ref(false);
const pendingProvider = ref<OAuthProvider | null>(null);

async function submitting<T>(work: () => Promise<T>): Promise<T> {
  isSubmitting.value = true;
  try {
    return await work();
  } finally {
    isSubmitting.value = false;
  }
}

function simulate<T>(result: T): Promise<T> {
  return submitting(() => new Promise<T>((resolve) => setTimeout(() => resolve(result), DEMO_DELAY_MS)));
}

function isInvalidResetLink(error_: unknown): boolean {
  if (!(error_ instanceof ApiError) || error_.status !== 400) {
    return false;
  }
  const { message } = (error_.body ?? {}) as { message?: unknown };
  return typeof message === 'string';
}

function start(session: AuthSession, remember: boolean): void {
  saveSession(session, remember);
  user.value = session.user;
}

function rememberUser(next: AuthUser): void {
  const session = loadSession();
  if (session) {
    saveSession({ ...session, user: next }, isRememberedSession());
  }
  user.value = next;
}

function signOut(): void {
  clearSession();
  user.value = null;
}

async function restore(): Promise<void> {
  if (!loadSession()) {
    user.value = null;
    return;
  }
  try {
    user.value = await apiGet<AuthUser>('/auth/me');
  } catch (error_) {
    if (error_ instanceof ApiError && error_.status === 401) {
      signOut();
    }
  }
}

export interface UseAuth {
  user: DeepReadonly<Ref<AuthUser | null>>;
  isAuthenticated: ComputedRef<boolean>;
  isSubmitting: Ref<boolean>;
  pendingProvider: Ref<OAuthProvider | null>;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (account: SignUpInput) => Promise<void>;
  signInWith: (provider: OAuthProvider) => Promise<void>;
  signOut: () => void;
  restore: () => Promise<void>;
  changeEmail: (email: string, currentPassword: string) => Promise<void>;
  updateUser: (changes: Partial<Pick<AuthUser, 'displayName' | 'username'>>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

export function useAuth(): UseAuth {
  return {
    user: readonly(user),
    isAuthenticated: computed(() => user.value !== null),
    isSubmitting,
    pendingProvider,
    signIn: (email, password, remember) =>
      submitting(async () => {
        start(await apiPost<AuthSession>('/auth/sign-in', { email, password, remember }), remember);
      }),
    signUp: (account) =>
      submitting(async () => {
        start(await apiPost<AuthSession>('/auth/sign-up', account), false);
      }),
    signInWith: async (provider) => {
      pendingProvider.value = provider;
      try {
        await simulate(undefined);
      } finally {
        pendingProvider.value = null;
      }
      const label = provider === 'google' ? 'Google' : 'Apple';
      throw new Error(t('errors.oauthUnavailable', { provider: label }));
    },
    signOut,
    restore,
    changeEmail: (email, currentPassword) =>
      submitting(async () => {
        rememberUser(await apiPatch<AuthUser>('/auth/me/email', { email, currentPassword }));
      }),
    updateUser: (changes) => {
      if (user.value) {
        rememberUser({ ...user.value, ...changes });
      }
    },
    changePassword: (currentPassword, newPassword) =>
      submitting(async () => {
        const remember = isRememberedSession();
        start(await apiPatch<AuthSession>('/auth/me/password', { currentPassword, newPassword, remember }), remember);
      }),
    requestPasswordReset: (email) =>
      submitting(async () => {
        await apiPost('/auth/password/forgot', { email });
      }),
    resetPassword: (token, password) =>
      submitting(async () => {
        try {
          await apiPost('/auth/password/reset', { token, password });
        } catch (error_) {
          if (isInvalidResetLink(error_)) {
            return false;
          }
          throw error_;
        }
        signOut();
        return true;
      }),
  };
}
