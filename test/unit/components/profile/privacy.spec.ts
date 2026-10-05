// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PrivacyPanel from '@/components/profile/PrivacyPanel.vue';
import { useAuth } from '@/composables/useAuth';
import { setLocale } from '@/i18n';
import type { UserPage } from '@/types/friends';
import UserPageView from '@/views/UserPageView.vue';
import SettingsView from '@/views/SettingsView.vue';
import { authUser, fakeApi, profile, userCard, userPage } from '../../../support/fake-api';
import { clearToasts, flushPromises, mountWith, requestsTo, stubFetch } from '../../../support/mount';

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: authUser };

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
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
  setLocale('en');
});

describe('PrivacyPanel', () => {
  it('explains a private page and changes the visibility', async () => {
    const { wrapper } = await mountWith(PrivacyPanel, { props: { profile: { ...profile }, isSaving: false } });

    expect(wrapper.text()).toContain('People who are not your friends see only your name');
    const publicButton = wrapper.findAll('button').find((button) => button.text() === 'Public');
    await publicButton?.trigger('click');

    expect(wrapper.emitted('change')).toEqual([[{ profileVisibility: 'public' }]]);
  });

  it('describes a public page and lets the user pick each block', async () => {
    const { wrapper } = await mountWith(PrivacyPanel, {
      props: { profile: { ...profile, profileVisibility: 'public', showWorkouts: false }, isSaving: false },
    });

    expect(wrapper.text()).toContain('Anyone signed in can open your page');
    const boxes = wrapper.findAll('input[type="checkbox"]');
    expect(boxes.map((box) => (box.element as HTMLInputElement).checked)).toEqual([true, true, true, false, true]);
    expect(wrapper.text()).toContain('Latest workouts');
    expect(wrapper.text()).toContain('Your friends always see the blocks you checked');

    await boxes[3]?.setValue(true);
    await boxes[4]?.setValue(false);
    expect(wrapper.emitted('change')).toEqual([[{ showWorkouts: true }], [{ showInLeaderboard: false }]]);
  });

  it('speaks French', async () => {
    setLocale('fr');
    const { wrapper } = await mountWith(PrivacyPanel, { props: { profile: { ...profile }, isSaving: false } });
    expect(wrapper.text()).toContain('Classement des amis');
  });

  it('saves the choice from the Privacy section of the settings', async () => {
    const fetchMock = stubFetch((url, init) =>
      url.includes('/me/profile') && init?.method === 'PATCH' ? { ...profile, ...JSON.parse(String(init.body)) } : fakeApi()(url),
    );
    localStorage.setItem('hevy-dashboard.session', JSON.stringify(SESSION));
    await useAuth().restore();
    const { wrapper } = await mountWith(SettingsView, { route: { query: { tab: 'settings', section: 'privacy' } } });
    await settle();

    await wrapper.findAll('button').find((button) => button.text() === 'Public')?.trigger('click');
    await settle();

    expect(requestsTo(fetchMock, '/me/profile').find((call) => call.method === 'PATCH')?.body).toEqual({ profileVisibility: 'public' });
  });
});

describe('UserPageView privacy', () => {
  async function mountPage(page: UserPage) {
    stubFetch((url) => (url.includes('/users/') ? page : fakeApi()(url)));
    const mounted = await mountWith(UserPageView, { route: { query: { tab: 'friends', user: page.username } } });
    await settle();
    return mounted;
  }

  it('shows only the identity of a private page, with the friend request button', async () => {
    const { wrapper } = await mountPage({
      ...userCard({ username: 'nina.rossi', displayName: 'Nina Rossi', friendship: 'none' }),
      isPrivate: true,
      bio: null,
      location: null,
      memberSince: null,
      stats: null,
      recentTrophies: null,
      recentWorkouts: null,
    });

    expect(wrapper.text()).toContain('This page is private');
    expect(wrapper.text()).toContain('Only the friends of Nina Rossi see their stats');
    expect(wrapper.text()).not.toContain('Member since');
    expect(wrapper.text()).not.toContain('Latest workouts');
    expect(wrapper.text()).toContain('Add friend');
  });

  it('leaves out the blocks the owner hid', async () => {
    const { wrapper } = await mountPage({ ...userPage, recentWorkouts: null, bio: null, location: null });

    expect(wrapper.text()).toContain('Latest trophies');
    expect(wrapper.text()).not.toContain('Latest workouts');
    expect(wrapper.text()).not.toContain('Push, pull, legs.');
    expect(wrapper.text()).not.toContain('This page is private');
  });

  it('says when a public page shows nothing', async () => {
    const { wrapper } = await mountPage({ ...userPage, stats: null, recentWorkouts: null, recentTrophies: null });
    expect(wrapper.text()).toContain('keeps the details of this page to themselves');
  });
});

describe('previewing your own page', () => {
  async function mountOwnPage(query: Record<string, string>) {
    const fetchMock = stubFetch((url) => {
      if (url.includes('/users/william')) {
        const as = new URL(url, 'http://x').searchParams.get('as');
        return as === 'stranger'
          ? { ...userCard({ username: 'william', displayName: 'William Smith', friendship: 'self' }), isPrivate: true, bio: null, location: null, memberSince: null, stats: null, recentTrophies: null, recentWorkouts: null }
          : { ...userPage, username: 'william', displayName: 'William Smith', friendship: 'self' };
      }
      return url.includes('/auth/me') ? authUser : fakeApi()(url);
    });
    localStorage.setItem('hevy-dashboard.session', JSON.stringify(SESSION));
    await useAuth().restore();
    const mounted = await mountWith(UserPageView, { route: { query: { tab: 'friends', user: 'william', ...query } } });
    await settle();
    return { ...mounted, fetchMock };
  }

  it('switches between your view, a friend’s and someone else’s, through the address', async () => {
    const { wrapper, router, fetchMock } = await mountOwnPage({});
    expect(wrapper.text()).toContain('This is your page as you see it.');
    expect(wrapper.text()).toContain('Latest workouts');

    await wrapper.findAll('button').find((button) => button.text() === 'Someone else')?.trigger('click');
    await settle();

    expect(router.currentRoute.value.query).toMatchObject({ tab: 'friends', user: 'william', as: 'stranger' });
    expect(fetchMock.mock.calls.map(([url]) => String(url)).at(-1)).toContain('as=stranger');
    expect(wrapper.text()).toContain('Preview: this is what people who are not your friends see.');
    expect(wrapper.text()).toContain('This page is private');

    await wrapper.findAll('button').find((button) => button.text() === 'Me')?.trigger('click');
    await settle();
    expect(router.currentRoute.value.query.as).toBeUndefined();
    expect(wrapper.text()).toContain('Latest workouts');
  });

  it('opens straight on a preview from the address and never previews someone else’s page', async () => {
    const { wrapper, fetchMock } = await mountOwnPage({ as: 'friend' });
    expect(fetchMock.mock.calls.map(([url]) => String(url)).find((url) => url.includes('/users/william'))).toContain('as=friend');
    expect(wrapper.text()).toContain('Preview: this is what your friends see.');

    stubFetch((url) => (url.includes('/users/') ? userPage : fakeApi()(url)));
    const other = await mountWith(UserPageView, { route: { query: { tab: 'friends', user: 'lea.martin', as: 'stranger' } } });
    await settle();
    expect(other.wrapper.text()).not.toContain('View as');
  });

  it('links to the preview from the privacy settings', async () => {
    const { wrapper } = await mountWith(PrivacyPanel, { props: { profile: { ...profile }, isSaving: false } });
    const link = wrapper.findAll('a').find((item) => item.text().includes('Preview my page'));
    expect(link?.attributes('href')).toContain('as=stranger');
    expect(link?.attributes('href')).toContain('user=william');
  });
});
