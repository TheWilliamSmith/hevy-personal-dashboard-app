// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue';
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue';
import SignInView from '@/views/auth/SignInView.vue';
import SignUpView from '@/views/auth/SignUpView.vue';
import { authUser } from '../../support/fake-api';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../support/mount';

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: authUser };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  useAuth().signOut();
  clearToasts();
  document.body.innerHTML = '';
});

async function fill(wrapper: VueWrapper, values: Record<string, string>): Promise<void> {
  for (const [id, value] of Object.entries(values)) {
    await wrapper.get(`#${id}`).setValue(value);
  }
}

async function submit(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await flushPromises();
}

describe('SignInView', () => {
  it('validates the form before calling the API', async () => {
    const fetchMock = stubFetch(() => SESSION);
    const { wrapper } = await mountWith(SignInView, { route: { name: 'sign-in' } });

    await submit(wrapper);

    expect(wrapper.text()).toContain('Enter a valid email address.');
    expect(wrapper.text()).toContain('Enter your password.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('signs in and goes to the redirect target', async () => {
    const fetchMock = stubFetch(() => SESSION);
    const { wrapper, router } = await mountWith(SignInView, { route: { name: 'sign-in', query: { redirect: '/?tab=goals' } } });

    await fill(wrapper, { 'signin-email': ' william@example.com ', 'signin-password': 'Str0ng-pass' });
    await wrapper.get('input[type=checkbox]').setValue(false);
    await submit(wrapper);

    expect(requestsTo(fetchMock, '/auth/sign-in')[0]?.body).toEqual({ email: 'william@example.com', password: 'Str0ng-pass', remember: false });
    expect(router.currentRoute.value.query.tab).toBe('goals');
  });

  it('shows the API error', async () => {
    stubFetch(() => jsonResponse({ statusCode: 401, message: 'Wrong email or password.' }, 401));
    const { wrapper } = await mountWith(SignInView, { route: { name: 'sign-in' } });

    await fill(wrapper, { 'signin-email': 'william@example.com', 'signin-password': 'nope-nope' });
    await submit(wrapper);

    expect(wrapper.get('[role=alert]').text()).toBe('Wrong email or password.');
  });

  it('explains an expired session and cleans the address', async () => {
    stubFetch(() => ({}));
    const { router } = await mountWith(SignInView, { route: { name: 'sign-in', query: { reason: 'expired', redirect: '/' } } });
    await flushPromises();

    expect(useToasts().toasts.value.at(-1)?.title).toBe('Your session ended');
    expect(router.currentRoute.value.query).toEqual({ redirect: '/' });
  });

  it('reports that social sign-in is not ready', async () => {
    vi.useFakeTimers();
    stubFetch(() => ({}));
    const { wrapper } = await mountWith(SignInView, { route: { name: 'sign-in' } });

    await wrapper.findAll('button').find((button) => button.text().includes('Google'))?.trigger('click');
    await vi.advanceTimersByTimeAsync(1000);
    await flushPromises();

    expect(wrapper.get('[role=alert]').text()).toContain('Google sign-in is not available yet');
  });

  it('shows and hides the password', async () => {
    stubFetch(() => ({}));
    const { wrapper } = await mountWith(SignInView, { route: { name: 'sign-in' } });

    await wrapper.get('[aria-label="Show password"]').trigger('click');
    expect(wrapper.get('#signin-password').attributes('type')).toBe('text');
    await wrapper.get('[aria-label="Hide password"]').trigger('click');
    expect(wrapper.get('#signin-password').attributes('type')).toBe('password');
  });
});

describe('SignUpView', () => {
  it('suggests a username from the display name until it is edited', async () => {
    stubFetch(() => ({}));
    const { wrapper } = await mountWith(SignUpView, { route: { name: 'sign-up' } });

    await wrapper.get('#signup-display-name').setValue('Élodie Martin');
    expect((wrapper.get('#signup-username').element as HTMLInputElement).value).toBe('elodie.martin');

    await wrapper.get('#signup-username').setValue('elo');
    await wrapper.get('#signup-display-name').setValue('Élodie M');
    expect((wrapper.get('#signup-username').element as HTMLInputElement).value).toBe('elo');
  });

  it('lists every problem on submit', async () => {
    const fetchMock = stubFetch(() => SESSION);
    const { wrapper } = await mountWith(SignUpView, { route: { name: 'sign-up' } });

    await fill(wrapper, { 'signup-username': 'NO', 'signup-email': 'not-an-email', 'signup-password': 'short' });
    await submit(wrapper);

    const text = wrapper.text();
    expect(text).toContain('Tell us what to call you.');
    expect(text).toContain('Use 3 to 30 lowercase letters');
    expect(text).toContain('Enter a valid email address.');
    expect(text).toContain('Use at least 8 characters.');
    expect(text).toContain('Accept the terms to create an account.');
    expect(text).toContain('Too short');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates the account and welcomes the user', async () => {
    const fetchMock = stubFetch(() => jsonResponse(SESSION, 201));
    const { wrapper, router } = await mountWith(SignUpView, { route: { name: 'sign-up' } });

    await fill(wrapper, {
      'signup-display-name': 'William Smith',
      'signup-email': 'William@Example.com',
      'signup-password': 'Str0ng-pass!',
    });
    await wrapper.get('input[type=checkbox]').setValue(true);
    await submit(wrapper);

    expect(requestsTo(fetchMock, '/auth/sign-up')[0]?.body).toEqual({
      displayName: 'William Smith',
      username: 'william.smith',
      email: 'william@example.com',
      password: 'Str0ng-pass!',
    });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Account created');
    expect(router.currentRoute.value.query.tab).toBe('settings');
  });

  it('points at the field that is already taken', async () => {
    stubFetch(() => jsonResponse({ statusCode: 409, message: 'Taken', field: 'username' }, 409));
    const { wrapper } = await mountWith(SignUpView, { route: { name: 'sign-up' } });

    await fill(wrapper, { 'signup-display-name': 'William', 'signup-email': 'w@example.com', 'signup-password': 'Str0ng-pass!' });
    await wrapper.get('input[type=checkbox]').setValue(true);
    await submit(wrapper);

    expect(wrapper.text()).toContain('This username is already taken.');
  });

  it('points at a taken email and shows other errors in the banner', async () => {
    const responses = [
      jsonResponse({ statusCode: 409, message: 'Taken', field: 'email' }, 409),
      jsonResponse({ statusCode: 500, message: 'Boom' }, 500),
    ];
    stubFetch(() => responses.shift());
    const { wrapper } = await mountWith(SignUpView, { route: { name: 'sign-up' } });

    await fill(wrapper, { 'signup-display-name': 'William', 'signup-email': 'w@example.com', 'signup-password': 'Str0ng-pass!' });
    await wrapper.get('input[type=checkbox]').setValue(true);
    await submit(wrapper);
    expect(wrapper.text()).toContain('An account already exists for this email.');

    await fill(wrapper, { 'signup-email': 'other@example.com' });
    await submit(wrapper);
    expect(wrapper.find('[role=alert]').exists()).toBe(true);
  });

  it('reports that social sign-up is not ready', async () => {
    vi.useFakeTimers();
    stubFetch(() => ({}));
    const { wrapper } = await mountWith(SignUpView, { route: { name: 'sign-up' } });

    await wrapper.findAll('button').find((button) => button.text().includes('Apple'))?.trigger('click');
    await vi.advanceTimersByTimeAsync(1000);
    await flushPromises();

    expect(wrapper.get('[role=alert]').text()).toContain('Apple sign-in is not available yet');
  });
});

describe('ForgotPasswordView', () => {
  it('validates the email, sends the link and lets the user try another address', async () => {
    const fetchMock = stubFetch(() => jsonResponse({}, 202));
    const { wrapper } = await mountWith(ForgotPasswordView, { route: { name: 'forgot-password', query: { email: 'oops' } } });

    await submit(wrapper);
    expect(wrapper.text()).toContain('Enter a valid email address.');

    await fill(wrapper, { 'forgot-email': 'william@example.com' });
    await submit(wrapper);

    expect(requestsTo(fetchMock, '/auth/password/forgot')[0]?.body).toEqual({ email: 'william@example.com' });
    expect(wrapper.text()).toContain('Check your inbox');
    expect(wrapper.text()).toContain('william@example.com');

    await wrapper.findAll('button').find((button) => button.text() === 'try another address')?.trigger('click');
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('shows the API error', async () => {
    stubFetch(() => jsonResponse({ statusCode: 429, message: 'Too many attempts.' }, 429));
    const { wrapper } = await mountWith(ForgotPasswordView, { route: { name: 'forgot-password' } });

    await fill(wrapper, { 'forgot-email': 'william@example.com' });
    await submit(wrapper);

    expect(wrapper.get('[role=alert]').text()).toBe('Too many attempts.');
  });
});

describe('ResetPasswordView', () => {
  it('shows an invalid link without a token', async () => {
    stubFetch(() => ({}));
    const { wrapper } = await mountWith(ResetPasswordView, { route: { name: 'reset-password' } });

    expect(wrapper.text()).toContain('This link does not work');
  });

  it('checks both passwords, then updates it', async () => {
    const fetchMock = stubFetch(() => ({}));
    const { wrapper } = await mountWith(ResetPasswordView, { route: { name: 'reset-password', query: { token: 't'.repeat(43) } } });

    await fill(wrapper, { 'reset-password': 'Str0ng-pass!', 'reset-confirm': 'different' });
    await submit(wrapper);
    expect(wrapper.text()).toContain('The two passwords do not match.');

    await fill(wrapper, { 'reset-confirm': 'Str0ng-pass!' });
    await submit(wrapper);

    expect(requestsTo(fetchMock, '/auth/password/reset')[0]?.body).toEqual({ token: 't'.repeat(43), password: 'Str0ng-pass!' });
    expect(wrapper.text()).toContain('Password updated');
  });

  it('treats a refused token as an invalid link and shows other errors', async () => {
    const responses = [
      jsonResponse({ statusCode: 500, message: 'Server down' }, 500),
      jsonResponse({ statusCode: 400, message: 'This link is invalid or has expired.' }, 400),
    ];
    stubFetch(() => responses.shift());
    const { wrapper } = await mountWith(ResetPasswordView, { route: { name: 'reset-password', query: { token: 'abc' } } });

    await fill(wrapper, { 'reset-password': 'Str0ng-pass!', 'reset-confirm': 'Str0ng-pass!' });
    await submit(wrapper);
    expect(wrapper.find('[role=alert]').exists()).toBe(true);

    await submit(wrapper);
    expect(wrapper.text()).toContain('This link does not work');
  });
});
