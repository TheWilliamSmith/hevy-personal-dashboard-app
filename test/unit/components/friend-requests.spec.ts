// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authUser, fakeApi, userCard } from '../../support/fake-api';
import { flushPromises, mountWith, requestsTo, stubFetch } from '../../support/mount';

const mounted: VueWrapper[] = [];

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: authUser };

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
}

async function signedIn(): Promise<void> {
  localStorage.setItem('hevy-dashboard.session', JSON.stringify(SESSION));
  const { useAuth } = await import('@/composables/useAuth');
  await useAuth().restore();
}

function countHandler(counts: number[]) {
  let call = 0;
  return (url: string) => {
    if (url.includes('/friends/requests/count')) {
      const incoming = counts[Math.min(call, counts.length - 1)] ?? 0;
      call += 1;
      return { incoming };
    }
    return fakeApi()(url);
  };
}

async function mountSidebar() {
  const { default: AppSidebar } = await import('@/components/layout/AppSidebar.vue');
  const result = await mountWith(AppSidebar, { stubs: { HevySyncCard: true } });
  mounted.push(result.wrapper);
  await settle();
  return result;
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('friend request badge', () => {
  it('shows the number of requests waiting next to Friends', async () => {
    stubFetch(countHandler([2]));
    await signedIn();
    const { wrapper } = await mountSidebar();

    const friends = wrapper.findAll('a').find((link) => link.text().includes('Friends'));
    expect(friends?.text()).toContain('2');
    expect(friends?.text()).toContain('2 friend requests waiting');
  });

  it('shows nothing without requests and caps large numbers', async () => {
    stubFetch(countHandler([0]));
    await signedIn();
    const { wrapper } = await mountSidebar();
    expect(wrapper.text()).not.toContain('friend request');

    const { setFriendRequests } = await import('@/composables/useFriendRequests');
    setFriendRequests(12);
    await flushPromises();
    expect(wrapper.text()).toContain('9+');
    expect(wrapper.text()).toContain('12 friend requests waiting');
  });

  it('keeps a dot on the icon when the sidebar is collapsed', async () => {
    stubFetch(countHandler([1]));
    await signedIn();
    const { useSidebar } = await import('@/composables/useSidebar');
    useSidebar().toggleCollapsed();
    const { wrapper } = await mountSidebar();

    expect(wrapper.find('span.rounded-full.h-2.w-2').exists()).toBe(true);
    expect(wrapper.text()).toContain('1 friend request waiting');
  });

  it('checks again every minute and when the tab comes back', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const fetchMock = stubFetch(countHandler([0, 1, 3]));
    await signedIn();
    const { wrapper } = await mountSidebar();
    expect(requestsTo(fetchMock, '/friends/requests/count')).toHaveLength(1);

    vi.advanceTimersByTime(60_000);
    await settle();
    expect(requestsTo(fetchMock, '/friends/requests/count')).toHaveLength(2);
    expect(wrapper.text()).toContain('1 friend request waiting');

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(wrapper.text()).toContain('3 friend requests waiting');

    mounted.splice(0).forEach((item) => item.unmount());
    vi.advanceTimersByTime(120_000);
    await settle();
    expect(requestsTo(fetchMock, '/friends/requests/count')).toHaveLength(3);
  });

  it('refreshes after answering a request', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.includes('/accept')) return userCard({ friendship: 'friends', requestId: null });
      if (url.includes('/friends/requests/count')) return { incoming: 0 };
      return fakeApi()(url);
    });
    await signedIn();
    const { setFriendRequests, useFriendRequests } = await import('@/composables/useFriendRequests');
    setFriendRequests(1);
    const { default: FriendActions } = await import('@/components/friends/FriendActions.vue');
    const { wrapper } = await mountWith(FriendActions, {
      props: { user: userCard({ friendship: 'incoming', requestId: 'r1' }) },
    });

    await wrapper.findAll('button').find((button) => button.text().trim() === 'Accept')?.trigger('click');
    await settle();

    expect(requestsTo(fetchMock, '/friends/requests/count').length).toBeGreaterThanOrEqual(1);
    expect(useFriendRequests().incoming.value).toBe(0);
  });

  it('does not ask the API when signed out', async () => {
    const fetchMock = stubFetch(countHandler([4]));
    const { refreshFriendRequests, useFriendRequests } = await import('@/composables/useFriendRequests');

    await refreshFriendRequests();

    expect(requestsTo(fetchMock, '/friends/requests/count')).toHaveLength(0);
    expect(useFriendRequests().incoming.value).toBe(0);
  });
});
