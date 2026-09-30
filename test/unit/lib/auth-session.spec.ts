// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSession } from '@/types/auth';

const STORAGE_KEY = 'hevy-dashboard.session';
const NOW = Date.parse('2026-01-01T00:00:00Z');

function session(expiresAt = '2026-01-02T00:00:00Z'): AuthSession {
  return {
    accessToken: 'token-1',
    tokenType: 'Bearer',
    expiresAt,
    user: {
      id: 'u1',
      email: 'alex@example.com',
      username: 'alex.lifts',
      displayName: 'Alex',
      createdAt: '2025-12-01T00:00:00Z',
    },
  };
}

async function freshModule() {
  vi.resetModules();
  return import('@/lib/auth-session');
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('auth-session', () => {
  it('keeps a remembered session in localStorage', async () => {
    const { saveSession } = await freshModule();
    saveSession(session(), true);

    expect(localStorage.getItem(STORAGE_KEY)).toContain('token-1');
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('keeps any other session in sessionStorage', async () => {
    const { saveSession } = await freshModule();
    saveSession(session(), false);

    expect(sessionStorage.getItem(STORAGE_KEY)).toContain('token-1');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('reads a stored session back after a reload', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session()));
    const { accessToken } = await freshModule();

    expect(accessToken(NOW)).toBe('token-1');
  });

  it('drops an expired session', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session('2025-12-31T23:59:59Z')));
    const { loadSession } = await freshModule();

    expect(loadSession(NOW)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores a corrupted stored value', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const { loadSession } = await freshModule();

    expect(loadSession(NOW)).toBeNull();
  });

  it('clears both storages', async () => {
    const { clearSession, saveSession, loadSession } = await freshModule();
    saveSession(session(), true);
    clearSession();

    expect(loadSession(NOW)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
