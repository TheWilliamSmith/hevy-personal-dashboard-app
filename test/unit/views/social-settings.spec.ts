// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ExercisePicker from '@/components/exercises/ExercisePicker.vue';
import GoalFormDialog from '@/components/goals/GoalFormDialog.vue';
import { useAuth } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { locale, setLocale } from '@/i18n';
import { saveSession } from '@/lib/auth-session';
import { weightUnit } from '@/utils/preferences';
import FriendsView from '@/views/FriendsView.vue';
import GoalsView from '@/views/GoalsView.vue';
import SettingsView from '@/views/SettingsView.vue';
import { authUser, fakeApi, goal, profile, userCard } from '../../support/fake-api';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../support/mount';

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer' as const, expiresAt: '2099-01-01T00:00:00Z', user: authUser };

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(): Promise<void> {
  for (let round = 0; round < 4; round += 1) {
    await flushPromises();
  }
}

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find((item) => item.text().trim() === label || item.text().trim().endsWith(label));
  if (!found) {
    throw new Error(`No button "${label}" in: ${wrapper.text()}`);
  }
  return found;
}

function bodyButton(label: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')]
    .reverse()
    .find((item) => item.textContent?.trim() === label || item.textContent?.trim().endsWith(label));
  if (!found) {
    throw new Error(`No button "${label}" in the page`);
  }
  return found;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  clearToasts();
  document.body.innerHTML = '';
  setLocale('en');
});

describe('FriendsView', () => {
  it('shows requests, leaderboard and friends, and searches users', async () => {
    const fetchMock = stubFetch(fakeApi({ '/users/search': [userCard({ id: 'u9', username: 'zoe', displayName: 'Zoé' })] }));
    const { wrapper } = await mountWith(FriendsView, { route: { query: { tab: 'friends' } } });
    await settle();

    expect(wrapper.text()).toContain('Tom Durand');
    expect(wrapper.text()).toContain('Nina Rossi');
    expect(wrapper.text()).toContain('Friends since');
    expect(wrapper.text()).toContain('8,200 kg');

    await button(wrapper, 'Workouts this month').trigger('click');
    await button(wrapper, 'Trophies').trigger('click');
    expect(wrapper.text()).toContain('18');

    await wrapper.get('#friends-search').setValue('z');
    await wait(350);
    expect(wrapper.text()).toContain('Type at least 2 characters.');

    await wrapper.get('#friends-search').setValue('zoe');
    await wait(350);
    await settle();

    expect(requestsTo(fetchMock, '/users/search?q=zoe')).toHaveLength(1);
    expect(wrapper.text()).toContain('Zoé');

    await button(wrapper, 'Add friend').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/friends/requests').some((call) => call.method === 'POST')).toBe(true);
  });

  it('says when nobody matches and reports search errors', async () => {
    const responses: unknown[] = [[], jsonResponse({ statusCode: 500, message: 'Search is down' }, 500)];
    stubFetch((url) => (url.includes('/users/search') ? responses.shift() : fakeApi()(url)));
    const { wrapper } = await mountWith(FriendsView, { route: { query: { tab: 'friends' } } });
    await settle();

    await wrapper.get('#friends-search').setValue('nobody');
    await wait(350);
    await settle();
    expect(wrapper.text()).toContain('Nobody matches “nobody”.');

    await wrapper.get('#friends-search').setValue('again');
    await wait(350);
    await settle();
    expect(wrapper.text()).toContain('The server failed to answer.');
  });

  it('shows the empty state without friends', async () => {
    stubFetch(fakeApi({ '/friends': { friends: [], incoming: [], outgoing: [] }, '/friends/leaderboard': [] }));
    const { wrapper } = await mountWith(FriendsView, { route: { query: { tab: 'friends' } } });
    await settle();

    expect(wrapper.text()).toContain('No pending request.');
    expect(wrapper.text()).toContain('No friend yet.');
  });
});

describe('SettingsView', () => {
  beforeEach(() => {
    saveSession(SESSION, true);
  });

  async function signedIn(): Promise<void> {
    await useAuth().restore();
    await settle();
  }

  afterEach(() => {
    useAuth().signOut();
  });

  it('saves the profile and reports a taken username', async () => {
    const responses: unknown[] = [];
    const fetchMock = stubFetch((url, init) => {
      if (url.includes('/me/profile') && init?.method === 'PATCH') {
        return responses.shift() ?? profile;
      }
      return fakeApi()(url);
    });
    await signedIn();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings' } } });
    await settle();

    expect(wrapper.text()).toContain('Public profile');
    await wrapper.get('#profile-name').setValue('Will');
    await wrapper.get('#profile-bio').setValue('New bio');
    await wrapper.get('#profile-bodyweight').setValue('81.5');
    await button(wrapper, 'Save changes').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/me/profile').find((call) => call.method === 'PATCH')?.body).toMatchObject({
      displayName: 'Will',
      bio: 'New bio',
      bodyweightKg: 81.5,
    });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Profile saved');

    responses.push(jsonResponse({ statusCode: 409, message: 'This username is already taken.', field: 'username' }, 409));
    await wrapper.get('#profile-username').setValue('taken.name');
    await button(wrapper, 'Save changes').trigger('click');
    await settle();
    expect(wrapper.text()).toContain('This username is already taken.');

    await button(wrapper, 'Discard').trigger('click');
    expect((wrapper.get('#profile-username').element as HTMLInputElement).value).toBe('william');
  });

  it('reports a failed save in a toast', async () => {
    stubFetch((url, init) =>
      url.includes('/me/profile') && init?.method === 'PATCH' ? jsonResponse({ statusCode: 500, message: 'Down' }, 500) : fakeApi()(url),
    );
    await signedIn();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings' } } });
    await settle();

    await wrapper.get('#profile-location').setValue('Paris');
    await button(wrapper, 'Save changes').trigger('click');
    await settle();

    expect(useToasts().toasts.value.at(-1)).toMatchObject({ tone: 'error', title: 'Could not save your profile' });
  });

  it('uploads and removes the profile picture', async () => {
    const fetchMock = stubFetch((url) => (url.includes('/me/avatar') ? { ...profile, avatarUrl: '/users/u1/avatar?v=2' } : fakeApi()(url)));
    await signedIn();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings' } } });
    await settle();

    const input = wrapper.get('#profile-avatar-file');
    Object.defineProperty(input.element, 'files', { value: [new File(['png'], 'me.png', { type: 'image/png' })] });
    await input.trigger('change');
    await settle();
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Profile picture updated');

    await button(wrapper, 'Remove').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/me/avatar').map((call) => call.method)).toEqual(['POST', 'DELETE']);
  });

  it('changes email and password from the account section', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/auth/me/email')) return { ...authUser, email: 'new@example.com' };
      if (url.endsWith('/auth/me/password')) return SESSION;
      return fakeApi()(url);
    });
    await signedIn();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings', section: 'account' } } });
    await settle();

    await button(wrapper, 'Change email').trigger('click');
    await settle();
    expect(wrapper.text()).toContain('Enter a valid email address.');

    await wrapper.get('#security-new-email').setValue('new@example.com');
    await wrapper.get('#security-email-password').setValue('current-pass');
    await button(wrapper, 'Change email').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/auth/me/email')[0]?.body).toEqual({ email: 'new@example.com', currentPassword: 'current-pass' });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Email changed');

    await button(wrapper, 'Change password').trigger('click');
    await settle();
    expect(wrapper.text()).toContain('Enter your current password.');

    await wrapper.get('#security-current-password').setValue('current-pass');
    await wrapper.get('#security-new-password').setValue('N3w-password!');
    await wrapper.get('#security-confirm-password').setValue('N3w-password!');
    await button(wrapper, 'Change password').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/auth/me/password')[0]?.body).toMatchObject({ currentPassword: 'current-pass', newPassword: 'N3w-password!' });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Password changed');
  });

  it('shows field errors from the API on account changes', async () => {
    stubFetch((url) => {
      if (url.endsWith('/auth/me/email')) return jsonResponse({ statusCode: 409, message: 'Email taken', field: 'email' }, 409);
      if (url.endsWith('/auth/me/password')) return jsonResponse({ statusCode: 400, message: 'Wrong password', field: 'currentPassword' }, 400);
      return fakeApi()(url);
    });
    await signedIn();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings', section: 'account' } } });
    await settle();

    await wrapper.get('#security-new-email').setValue('taken@example.com');
    await wrapper.get('#security-email-password').setValue('pass');
    await button(wrapper, 'Change email').trigger('click');
    await settle();
    expect(wrapper.text()).toContain('Email taken');

    await wrapper.get('#security-current-password').setValue('bad');
    await wrapper.get('#security-new-password').setValue('N3w-password!');
    await wrapper.get('#security-confirm-password').setValue('N3w-password!');
    await button(wrapper, 'Change password').trigger('click');
    await settle();
    expect(wrapper.text()).toContain('Wrong password');
  });

  it('switches the language and saves units from preferences', async () => {
    const fetchMock = stubFetch((url, init) =>
      url.includes('/me/profile') && init?.method === 'PATCH' ? { ...profile, ...JSON.parse(String(init.body)) } : fakeApi()(url),
    );
    await signedIn();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings', section: 'preferences' } } });
    await settle();

    await button(wrapper, 'Pounds').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/me/profile').find((call) => call.method === 'PATCH')?.body).toEqual({ weightUnit: 'lb' });
    expect(weightUnit.value).toBe('lb');
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Preferences saved');

    await button(wrapper, 'Sunday').trigger('click');
    await settle();

    await button(wrapper, 'Light').trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/me/profile').filter((call) => call.method === 'PATCH').at(-1)?.body).toEqual({ theme: 'light' });
    expect(document.documentElement.dataset.theme).toBe('light');

    await button(wrapper, 'Français').trigger('click');
    expect(locale.value).toBe('fr');
  });

  it('moves between sections and signs out', async () => {
    stubFetch(fakeApi());
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    await signedIn();
    const { wrapper, router } = await mountWith(SettingsView, { route: { query: { tab: 'settings' } } });
    await settle();

    await button(wrapper, 'Account').trigger('click');
    await settle();
    expect(router.currentRoute.value.query.section).toBe('account');

    await button(wrapper, 'Sign out').trigger('click');
    expect(assign).toHaveBeenCalledWith('/sign-in');
  });
});

describe('Goals', () => {
  it('creates, archives, restores and deletes goals', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/goals') && init?.method === 'POST') return jsonResponse(goal({ id: 'g9', type: 'WEEKLY_WORKOUTS', exercise: null, unit: 'workouts', target: 4 }), 201);
      if (url.includes('/goals/') && init?.method === 'PATCH') return goal({ archivedAt: '2026-10-01T00:00:00.000Z' });
      if (url.includes('/goals/') && init?.method === 'DELETE') return { id: 'g1' };
      return fakeApi()(url);
    });
    const { wrapper } = await mountWith(GoalsView, { route: { query: { tab: 'goals' } } });
    await settle();

    await button(wrapper, 'New goal').trigger('click');
    await settle();
    bodyButton('Workouts per week').click();
    await settle();
    const target = document.body.querySelector<HTMLInputElement>('#goal-target');
    target!.value = '4';
    target!.dispatchEvent(new Event('input'));
    bodyButton('Create goal').click();
    await settle();
    expect(requestsTo(fetchMock, '/goals').find((call) => call.method === 'POST')?.body).toEqual({ type: 'WEEKLY_WORKOUTS', target: 4 });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Goal created');

    await wrapper.findAll('[aria-label="Archive goal"]')[0]?.trigger('click');
    await settle();
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Goal archived');

    await wrapper.findAll('[aria-label="Delete goal"]')[0]?.trigger('click');
    await settle();
    bodyButton('Delete goal').click();
    await settle();
    expect(requestsTo(fetchMock, '/goals/').some((call) => call.method === 'DELETE')).toBe(true);
  });

  it('edits a goal and shows validation and API errors', async () => {
    const fetchMock = stubFetch((url, init) =>
      url.includes('/goals/') && init?.method === 'PATCH'
        ? jsonResponse({ statusCode: 400, message: 'The deadline must be after the start.', field: 'deadline' }, 400)
        : fakeApi()(url),
    );
    const { wrapper } = await mountWith(GoalFormDialog, { props: { open: true, goal: goal(), submit: async () => undefined } });
    await settle();
    expect(document.body.textContent).toContain('Edit goal');

    const target = document.body.querySelector<HTMLInputElement>('#goal-target');
    target!.value = '0';
    target!.dispatchEvent(new Event('input'));
    bodyButton('Save goal').click();
    await settle();
    expect(document.body.textContent).toContain('Enter a target above zero.');

    await wrapper.setProps({
      submit: async (): Promise<never> => {
        throw new (await import('@/lib/api')).ApiError('The deadline must be after the start.', 400, { field: 'deadline' });
      },
    } as never);
    target!.value = '130';
    target!.dispatchEvent(new Event('input'));
    bodyButton('Save goal').click();
    await settle();
    expect(document.body.textContent).toContain('The deadline must be after the start.');
    expect(fetchMock).toBeDefined();
  });

  it('asks for an exercise and a whole number of workouts', async () => {
    stubFetch(fakeApi());
    await mountWith(GoalFormDialog, { props: { open: true, goal: null, submit: async () => undefined } });
    await settle();

    const target = document.body.querySelector<HTMLInputElement>('#goal-target');
    target!.value = '100';
    target!.dispatchEvent(new Event('input'));
    bodyButton('Create goal').click();
    await settle();
    expect(document.body.textContent).toContain('Choose an exercise.');

    bodyButton('Workouts per week').click();
    await settle();
    target!.value = '2.5';
    target!.dispatchEvent(new Event('input'));
    bodyButton('Create goal').click();
    await settle();
    expect(document.body.textContent).toContain('Use a whole number of workouts, up to 14.');

    bodyButton('Total volume').click();
    await settle();
    expect(document.body.querySelector('#goal-start')).not.toBeNull();
    bodyButton('Cancel').click();
  });
});

describe('ExercisePicker', () => {
  const exercises = [
    { id: 'e1', name: 'Bicep Curl (Dumbbell)', sessions: 12 },
    { id: 'e2', name: 'Curl (Cable)', sessions: 0 },
    { id: 'e3', name: 'Squat (Barbell)', sessions: 30 },
  ];

  it('filters while typing, moves with the keyboard and picks an exercise', async () => {
    const { wrapper } = await mountWith(ExercisePicker, { props: { id: 'pick', modelValue: '', exercises } });

    const input = wrapper.get('#pick');
    await input.trigger('focus');
    expect(wrapper.text()).toContain('Squat (Barbell)');

    await input.setValue('curl');
    expect(wrapper.text()).toContain('Never performed');
    expect(wrapper.text()).not.toContain('Squat (Barbell)');

    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'ArrowUp' });
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toBeDefined();

    await input.setValue('zzz');
    expect(wrapper.text()).toContain('No exercise matches “zzz”.');
    await input.trigger('keydown', { key: 'Escape' });

    await input.setValue('squat');
    const option = wrapper.findAll('[role=option]')[0];
    await option?.trigger('mousemove');
    await option?.trigger('mousedown');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['e3']);
  });

  it('shows the selected exercise and clears it', async () => {
    const { wrapper } = await mountWith(ExercisePicker, { props: { id: 'pick', modelValue: 'e3', exercises } });

    expect((wrapper.get('#pick').element as HTMLInputElement).value).toBe('Squat (Barbell)');
    await wrapper.get('[aria-label="Clear the exercise"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
    await wrapper.get('#pick').trigger('blur');
  });
});
