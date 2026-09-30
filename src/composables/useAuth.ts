import { computed, readonly, ref, type ComputedRef, type DeepReadonly, type Ref } from 'vue';

import { ApiError, apiGet, apiPost } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/lib/auth-session';
import type { AuthSession, AuthUser } from '@/types/auth';

export type OAuthProvider = 'google' | 'apple';

export interface SignUpInput {
  displayName: string;
  username: string;
  email: string;
  password: string;
}

/*
 * Sign-in, sign-up and the current user go through the API. OAuth and the
 * password reset have no endpoint yet: OAuth refuses with a clear message,
 * and the reset flow stays a demo that never touches a real account.
 */
const DEMO_DELAY_MS = 600;
const EXPIRED_TOKEN = 'expired';

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

function start(session: AuthSession, remember: boolean): void {
  saveSession(session, remember);
  user.value = session.user;
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
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) {
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
      throw new Error(`${label} sign-in is not available yet. Use your email and password.`);
    },
    signOut,
    restore,
    requestPasswordReset: () => simulate(undefined),
    resetPassword: (token) => simulate(token !== EXPIRED_TOKEN),
  };
}
