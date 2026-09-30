import type { AuthSession } from '@/types/auth';

const STORAGE_KEY = 'hevy-dashboard.session';

/*
 * A remembered session goes to localStorage, any other one to sessionStorage
 * so it ends with the tab. Storage can be missing or throw (private mode,
 * blocked site data): the app then keeps the session in memory only.
 */
let current: AuthSession | null = null;

function storages(): Storage[] {
  try {
    return [window.localStorage, window.sessionStorage];
  } catch {
    return [];
  }
}

function isValid(session: AuthSession | null, now: number): session is AuthSession {
  return session !== null && Date.parse(session.expiresAt) > now;
}

function readStored(): AuthSession | null {
  for (const storage of storages()) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as AuthSession;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export function loadSession(now = Date.now()): AuthSession | null {
  current ??= readStored();
  if (!isValid(current, now)) {
    clearSession();
  }
  return current;
}

export function saveSession(session: AuthSession, remember: boolean): void {
  clearSession();
  current = session;
  const [local, perTab] = storages();
  try {
    (remember ? local : perTab)?.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

export function clearSession(): void {
  current = null;
  for (const storage of storages()) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      continue;
    }
  }
}

/** True when the current session lives in localStorage ("Keep me signed in"). */
export function isRememberedSession(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function accessToken(now = Date.now()): string | null {
  return loadSession(now)?.accessToken ?? null;
}
