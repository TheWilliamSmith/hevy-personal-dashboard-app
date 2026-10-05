// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AccountSecurity from '@/components/profile/AccountSecurity.vue';
import { useAuth } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { authUser } from '../../../support/fake-api';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../../support/mount';

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: authUser };
const EXPORT = { format: 'hevy-personal-dashboard-export', version: 1, profile: { username: 'william' }, workouts: [] };

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
}

function bodyButton(label: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')].reverse().find((item) => item.textContent?.trim() === label);
  if (!found) {
    throw new Error(`No button "${label}"`);
  }
  return found;
}

async function signedIn(): Promise<void> {
  localStorage.setItem('hevy-dashboard.session', JSON.stringify(SESSION));
  await useAuth().restore();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  useAuth().signOut();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearToasts();
  document.body.innerHTML = '';
});

describe('downloading your data', () => {
  it('saves the export as a JSON file named after the account', async () => {
    const fetchMock = stubFetch((url) => (url.includes('/me/export') ? EXPORT : authUser));
    await signedIn();
    const createObjectURL = vi.fn(() => 'blob:export');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toMatch(/^hevy-dashboard-william-\d{4}-\d{2}-\d{2}\.json$/);
    });
    const { wrapper } = await mountWith(AccountSecurity);

    await wrapper.findAll('button').find((button) => button.text() === 'Download')?.trigger('click');
    await settle();

    expect(requestsTo(fetchMock, '/me/export')).toHaveLength(1);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Your data was downloaded');
  });

  it('reports a failed export', async () => {
    stubFetch((url) => (url.includes('/me/export') ? jsonResponse({ statusCode: 429, message: 'Too many attempts.' }, 429) : authUser));
    await signedIn();
    const { wrapper } = await mountWith(AccountSecurity);

    await wrapper.findAll('button').find((button) => button.text() === 'Download')?.trigger('click');
    await settle();

    expect(useToasts().toasts.value.at(-1)).toMatchObject({ tone: 'error', title: 'Could not download your data' });
  });
});

describe('deleting the account', () => {
  it('asks for the password, shows a wrong one, then deletes and signs out', async () => {
    let attempts = 0;
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/me') && init?.method === 'DELETE') {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ statusCode: 400, message: 'Your current password is incorrect.', field: 'currentPassword' }, 400)
          : { deleted: true };
      }
      return authUser;
    });
    await signedIn();
    const { wrapper } = await mountWith(AccountSecurity);

    await wrapper.findAll('button').find((button) => button.text() === 'Delete account')?.trigger('click');
    await settle();
    expect(document.body.textContent).toContain('Delete your account?');

    bodyButton('Delete for good').click();
    await settle();
    expect(document.body.textContent).toContain('Enter your current password.');
    expect(requestsTo(fetchMock, '/me').filter((call) => call.method === 'DELETE')).toHaveLength(0);

    const type = (value: string) => {
      const input = document.body.querySelector<HTMLInputElement>('#delete-account-password');
      input!.value = value;
      input!.dispatchEvent(new Event('input'));
    };
    type('wrong-pass');
    bodyButton('Delete for good').click();
    await settle();
    expect(document.body.textContent).toContain('Your current password is incorrect.');
    expect(useAuth().isAuthenticated.value).toBe(true);

    type('Str0ng-pass');
    bodyButton('Delete for good').click();
    await settle();

    expect(requestsTo(fetchMock, '/me').filter((call) => call.method === 'DELETE').at(-1)?.body).toEqual({ currentPassword: 'Str0ng-pass' });
    expect(useAuth().isAuthenticated.value).toBe(false);
    expect(localStorage.getItem('hevy-dashboard.session')).toBeNull();
    expect(wrapper.emitted('signOut')).toHaveLength(1);
  });
});
