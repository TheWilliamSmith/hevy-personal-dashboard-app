// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EmailVerificationBanner from '@/components/layout/EmailVerificationBanner.vue';
import { useAuth } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import type { AuthUser } from '@/types/auth';
import VerifyEmailView from '@/views/auth/VerifyEmailView.vue';
import { authUser, fakeApi } from '../../support/fake-api';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../support/mount';

const UNVERIFIED: AuthUser = { ...authUser, emailVerified: false };
const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: UNVERIFIED };

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
}

async function signedInAs(user: AuthUser): Promise<void> {
  localStorage.setItem('hevy-dashboard.session', JSON.stringify({ ...SESSION, user }));
  await useAuth().restore();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  useAuth().signOut();
  vi.unstubAllGlobals();
  clearToasts();
  document.body.innerHTML = '';
});

describe('VerifyEmailView', () => {
  it('confirms the email and updates the signed-in user', async () => {
    const fetchMock = stubFetch((url) => (url.includes('/auth/verify-email') ? { ...authUser, emailVerified: true } : UNVERIFIED));
    await signedInAs(UNVERIFIED);

    const { wrapper } = await mountWith(VerifyEmailView, { route: { name: 'verify-email', query: { token: 'abc' } } });
    await settle();

    expect(requestsTo(fetchMock, '/auth/verify-email')[0]?.body).toEqual({ token: 'abc' });
    expect(wrapper.text()).toContain('Email confirmed');
    expect(wrapper.text()).toContain('william@example.com is confirmed.');
    expect(wrapper.text()).toContain('Open the dashboard');
    expect(useAuth().user.value?.emailVerified).toBe(true);
  });

  it('explains an invalid link, and offers sign in when signed out', async () => {
    stubFetch(() => jsonResponse({ statusCode: 400, message: 'invalid' }, 400));
    const { wrapper } = await mountWith(VerifyEmailView, { route: { name: 'verify-email', query: { token: 'old' } } });
    await settle();

    expect(wrapper.text()).toContain('Link not valid');
    expect(wrapper.text()).toContain('invalid, already used or expired');
    expect(wrapper.text()).toContain('Go to sign in');
  });

  it('says when another account took the new email', async () => {
    stubFetch(() => jsonResponse({ statusCode: 409, message: 'taken', field: 'email' }, 409));
    const { wrapper } = await mountWith(VerifyEmailView, { route: { name: 'verify-email', query: { token: 'abc' } } });
    await settle();

    expect(wrapper.text()).toContain('Another account started using this email');
  });

  it('does not call the API without a token', async () => {
    const fetchMock = stubFetch(() => ({}));
    const { wrapper } = await mountWith(VerifyEmailView, { route: { name: 'verify-email' } });
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Link not valid');
  });
});

describe('EmailVerificationBanner', () => {
  it('asks an unconfirmed user to confirm and resends the link', async () => {
    const fetchMock = stubFetch((url) =>
      url.includes('/auth/me/verification') ? { sentTo: UNVERIFIED.email } : url.includes('/auth/me') ? UNVERIFIED : fakeApi()(url),
    );
    await signedInAs(UNVERIFIED);
    const { wrapper } = await mountWith(EmailVerificationBanner);

    expect(wrapper.text()).toContain('Confirm your email address: we sent a link to william@example.com.');
    await wrapper.get('button').trigger('click');
    await settle();

    expect(requestsTo(fetchMock, '/auth/me/verification').map((call) => call.method)).toEqual(['POST']);
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Link sent to william@example.com');
  });

  it('reports a failed resend', async () => {
    stubFetch((url) =>
      url.includes('/auth/me/verification') ? jsonResponse({ statusCode: 429, message: 'Too many attempts.' }, 429) : UNVERIFIED,
    );
    await signedInAs(UNVERIFIED);
    const { wrapper } = await mountWith(EmailVerificationBanner);

    await wrapper.get('button').trigger('click');
    await settle();
    expect(useToasts().toasts.value.at(-1)).toMatchObject({ tone: 'error', title: 'Could not send the link' });
  });

  it('leaves a pending email change to the account settings', async () => {
    const pending: AuthUser = { ...UNVERIFIED, pendingEmail: 'new@example.com' };
    stubFetch(() => pending);
    await signedInAs(pending);
    const { wrapper } = await mountWith(EmailVerificationBanner);

    expect(wrapper.text()).toBe('');
  });

  it('stays hidden once the email is confirmed', async () => {
    stubFetch(() => authUser);
    await signedInAs(authUser);
    const { wrapper } = await mountWith(EmailVerificationBanner);

    expect(wrapper.text()).toBe('');
  });
});
