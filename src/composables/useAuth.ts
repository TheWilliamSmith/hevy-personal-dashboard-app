import { ref, type Ref } from 'vue';

export type OAuthProvider = 'google' | 'apple';

/*
 * Demo implementation until the authentication API exists: every call waits
 * a moment and succeeds, except the ones that simulate a server-side check.
 */
const DEMO_DELAY_MS = 600;
const EXPIRED_TOKEN = 'expired';

const isSubmitting = ref(false);
const pendingProvider = ref<OAuthProvider | null>(null);

async function simulate<T>(result: T): Promise<T> {
  isSubmitting.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
    return result;
  } finally {
    isSubmitting.value = false;
  }
}

export interface UseAuth {
  isSubmitting: Ref<boolean>;
  pendingProvider: Ref<OAuthProvider | null>;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWith: (provider: OAuthProvider) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

export function useAuth(): UseAuth {
  return {
    isSubmitting,
    pendingProvider,
    signIn: () => simulate(undefined),
    signUp: () => simulate(undefined),
    signInWith: async (provider) => {
      pendingProvider.value = provider;
      try {
        await simulate(undefined);
      } finally {
        pendingProvider.value = null;
      }
    },
    requestPasswordReset: () => simulate(undefined),
    resetPassword: (token) => simulate(token !== EXPIRED_TOKEN),
  };
}
