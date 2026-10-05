// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authUser, profile } from '../../support/fake-api';
import { flushPromises, requestsTo, stubFetch } from '../../support/mount';

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: authUser };

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
}

async function freshApp() {
  vi.resetModules();
  localStorage.setItem('hevy-dashboard.session', JSON.stringify(SESSION));
  const i18n = await import('@/i18n');
  const { useAuth } = await import('@/composables/useAuth');
  const { useProfile } = await import('@/composables/useProfile');
  return { i18n, useAuth, useProfile };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('account language', () => {
  it('sends the language of the app with every request', async () => {
    const fetchMock = stubFetch(() => authUser);
    const { i18n, useAuth } = await freshApp();
    i18n.setLocale('fr');
    await useAuth().restore();

    const headers = (fetchMock.mock.calls.at(-1)?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers['Accept-Language']).toBe('fr');
    i18n.setLocale('en');
  });

  it('applies the language saved on the account once it is synced', async () => {
    localStorage.setItem('hevy-dashboard.locale-synced', 'true');
    stubFetch((url) => (url.includes('/me/profile') ? { ...profile, locale: 'fr' } : authUser));
    const { i18n, useAuth } = await freshApp();
    localStorage.setItem('hevy-dashboard.locale-synced', 'true');
    await useAuth().restore();
    await settle();

    expect(i18n.locale.value).toBe('fr');
    i18n.setLocale('en');
  });

  it('pushes the language of the device to the account the first time', async () => {
    localStorage.setItem('hevy-dashboard.locale', 'fr');
    const fetchMock = stubFetch((url, init) =>
      url.includes('/me/profile') ? (init?.method === 'PATCH' ? { ...profile, locale: 'fr' } : { ...profile, locale: 'en' }) : authUser,
    );
    const { i18n, useAuth } = await freshApp();
    localStorage.setItem('hevy-dashboard.locale', 'fr');
    await useAuth().restore();
    await settle();

    expect(requestsTo(fetchMock, '/me/profile').find((call) => call.method === 'PATCH')?.body).toEqual({ locale: 'fr' });
    expect(i18n.locale.value).toBe('fr');
    expect(localStorage.getItem('hevy-dashboard.locale-synced')).toBe('true');
    i18n.setLocale('en');
  });
});
