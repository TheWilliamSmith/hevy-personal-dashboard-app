// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import type { HevyConnectionState } from '@/types/hevy';
import { achievement, authUser, fakeApi, hevyConnected, workoutDetail, workoutsPage } from '../../support/fake-api';
import { flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../support/mount';

const SESSION = { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: authUser };

class ResizeObserverStub {
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
}

function signIn(): void {
  localStorage.setItem('hevy-dashboard.session', JSON.stringify(SESSION));
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  Element.prototype.scrollTo = () => undefined;
  vi.stubGlobal(
    'matchMedia',
    () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('App', () => {
  it('sends a signed-out visitor to sign-in', async () => {
    stubFetch(fakeApi());
    const { default: App } = await import('@/App.vue');
    const { router } = await mountWith(App);
    await settle();

    expect(router.currentRoute.value.name).toBe('sign-in');
  });

  it('shows the shell to a signed-in user with the sync card and unseen trophies', async () => {
    signIn();
    stubFetch(fakeApi({ '/achievements/unseen': [achievement({ code: 'NEW_1', name: 'Brand New' })] }));
    const { default: App } = await import('@/App.vue');
    const { wrapper, router } = await mountWith(App, { route: { query: { tab: 'goals' } } });
    await settle();

    expect(router.currentRoute.value.name).toBe('home');
    expect(wrapper.text()).toContain('Hevy connected');
    await vi.waitFor(
      async () => {
        await flushPromises();
        expect(document.body.textContent).toContain('Achievement unlocked');
      },
      { timeout: 4000, interval: 50 },
    );
    expect(document.body.textContent).toContain('Brand New');
    [...document.body.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Nice')?.click();
    await settle();
  });

  it('uses the bare layout on auth pages', async () => {
    stubFetch(fakeApi());
    const { default: App } = await import('@/App.vue');
    const { wrapper } = await mountWith(App, { route: { name: 'sign-up' } });
    await settle();

    expect(wrapper.find('aside').exists()).toBe(false);
  });
});

describe('AppSidebar and AppTopBar', () => {
  it('collapses the sidebar, opens and closes the mobile menu, and remembers the choice', async () => {
    signIn();
    stubFetch(fakeApi());
    const { default: AppSidebar } = await import('@/components/layout/AppSidebar.vue');
    const { default: AppTopBar } = await import('@/components/layout/AppTopBar.vue');
    const { useSidebar } = await import('@/composables/useSidebar');
    const Shell = defineComponent({ render: () => h('div', [h(AppSidebar), h(AppTopBar)]) });
    const { wrapper, router } = await mountWith(Shell, { route: { query: { tab: 'friends' } } });
    await settle();

    expect(wrapper.text()).toContain('Friends');
    await wrapper.get('[aria-label="Collapse sidebar"]').trigger('click');
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
    await wrapper.get('[aria-label="Expand sidebar"]').trigger('click');
    expect(useSidebar().collapsed.value).toBe(false);

    await wrapper.get('[aria-label="Open menu"]').trigger('click');
    expect(useSidebar().mobileOpen.value).toBe(true);
    await wrapper.get('[aria-label="Close menu"]').trigger('click');
    expect(useSidebar().mobileOpen.value).toBe(false);

    useSidebar().openMobile();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(useSidebar().mobileOpen.value).toBe(false);

    await router.push({ name: 'home', query: { tab: 'workouts' } });
    await settle();
    expect(wrapper.text()).toContain('Workouts');
  });
});

describe('HevySyncCard and ConnectionIndicator', () => {
  async function mountCard(state: HevyConnectionState | Response) {
    stubFetch((url, init) => {
      if (url.includes('/hevy/sync') && init?.method === 'POST') return { id: 'run1', status: 'RUNNING' };
      if (url.includes('/hevy/connection')) return state;
      return {};
    });
    const { default: HevySyncCard } = await import('@/components/layout/HevySyncCard.vue');
    const { default: ConnectionIndicator } = await import('@/components/data/ConnectionIndicator.vue');
    const Both = defineComponent({ render: () => h('div', [h(HevySyncCard), h(ConnectionIndicator)]) });
    const mounted = await mountWith(Both);
    await settle();
    return mounted;
  }

  it('invites to connect when Hevy is not connected', async () => {
    const { wrapper } = await mountCard({ connected: false });
    expect(wrapper.text()).toContain('Connect Hevy');
    expect(wrapper.find('[title="Hevy not connected"]').exists()).toBe(true);
  });

  it('shows the last sync and starts a new one', async () => {
    const { wrapper } = await mountCard({ ...hevyConnected, drift: 0 } as HevyConnectionState);
    expect(wrapper.text()).toContain('@william_hevy');
    expect(wrapper.find('[title="Hevy connected and up to date"]').exists()).toBe(true);

    await wrapper.findAll('button').find((button) => button.text() === 'Sync now')?.trigger('click');
    await settle();
    expect(wrapper.text()).toContain('Syncing…');
  });

  it('flags a sync that needs attention', async () => {
    const { wrapper } = await mountCard({ ...hevyConnected, lastSyncStatus: 'FAILED', username: null, lastSyncAt: null } as HevyConnectionState);
    expect(wrapper.text()).toContain('Last sync needs attention.');
    expect(wrapper.find('[title="Hevy connected, needs attention"]').exists()).toBe(true);
  });

  it('says it is still checking while the connection loads', async () => {
    const { wrapper } = await mountCard(jsonResponse({ statusCode: 500, message: 'Down' }, 500));
    expect(wrapper.text()).toContain('Checking the connection…');
  });
});

describe('HomeView', () => {
  it.each([
    [{ tab: 'body' }, 'Muscle map'],
    [{ tab: 'friends' }, 'Find people'],
    [{ tab: 'friends', user: 'lea.martin' }, 'Latest trophies'],
    [{ tab: 'workouts' }, 'All workouts'],
    [{ tab: 'workouts', workout: 'w1' }, 'Felt strong.'],
    [{ tab: 'workouts', workout: 'w1', compare: 'w0' }, 'Shared exercises'],
    [{ tab: 'exercises' }, 'Most trained'],
    [{ tab: 'exercises', exercise: 'bench-press-barbell' }, 'Personal records'],
    [{}, 'Key metrics'],
  ])('shows the right panel for %o', async (query, text) => {
    signIn();
    stubFetch(fakeApi({ '/workouts/w0': workoutDetail({ id: 'w0' }), '/workouts': workoutsPage }));
    const { default: HomeView } = await import('@/views/HomeView.vue');
    const { wrapper } = await mountWith(HomeView, { route: { query } });

    await vi.waitFor(
      async () => {
        await flushPromises();
        expect(wrapper.text()).toContain(text);
      },
      { timeout: 4000, interval: 50 },
    );
  });
});

describe('HevyConnectionSection', () => {
  async function mountSection(handler: Parameters<typeof stubFetch>[0]) {
    const fetchMock = stubFetch(handler);
    const { default: HevyConnectionSection } = await import('@/components/data/HevyConnectionSection.vue');
    const mounted = await mountWith(HevyConnectionSection);
    await settle();
    return { ...mounted, fetchMock };
  }

  it('connects with a key, offers the first sync and runs it', async () => {
    let state: HevyConnectionState = { connected: false };
    const { wrapper, fetchMock } = await mountSection((url, init) => {
      if (url.includes('/hevy/connection') && init?.method === 'POST') {
        state = hevyConnected;
        return state;
      }
      if (url.includes('/hevy/sync') && init?.method === 'POST') return { id: 'run1', status: 'RUNNING' };
      if (url.includes('/hevy/connection')) return state;
      return {};
    });

    expect(wrapper.text()).toContain('Not connected');
    await wrapper.get('#hevy-api-key').setValue('not-a-key');
    await wrapper.get('#hevy-api-key').trigger('blur');
    expect(wrapper.text()).toContain('doesn’t look like a Hevy API key');

    await wrapper.findAll('button').find((button) => button.text() === 'Show')?.trigger('click');
    expect(wrapper.get('#hevy-api-key').attributes('type')).toBe('text');

    await wrapper.get('#hevy-api-key').setValue('11111111-2222-3333-4444-555555555555');
    await wrapper.get('form').trigger('submit');
    await settle();

    expect(wrapper.text()).toContain('Fetch your whole workout history now?');
    await wrapper.findAll('button').find((button) => button.text() === 'Fetch full history')?.trigger('click');
    await settle();
    expect(requestsTo(fetchMock, '/hevy/sync?full=true')).toHaveLength(1);
  });

  it('shows a refused key', async () => {
    const { wrapper } = await mountSection((_url, init) =>
      init?.method === 'POST' ? jsonResponse({ statusCode: 401, message: 'Nope' }, 401) : { connected: false },
    );

    await wrapper.get('#hevy-api-key').setValue('11111111-2222-3333-4444-555555555555');
    await wrapper.get('form').trigger('submit');
    await settle();

    expect(wrapper.text()).toContain('Hevy rejected this key.');
  });

  it('runs a full resync and disconnects after confirmation', async () => {
    const { wrapper, fetchMock } = await mountSection((url, init) => {
      if (url.includes('/hevy/sync') && init?.method === 'POST') return jsonResponse({ statusCode: 500, message: 'Down' }, 500);
      if (url.includes('/hevy/connection') && init?.method === 'DELETE') return {};
      if (url.includes('/hevy/connection')) return hevyConnected;
      return {};
    });

    expect(wrapper.text()).toContain('•••• abcd');
    expect(wrapper.text()).toContain('/ 14 on Hevy');

    await wrapper.findAll('button').find((button) => button.text() === 'Full resync')?.trigger('click');
    await settle();
    [...document.body.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Start full resync')?.click();
    await settle();
    expect(wrapper.find('[role=alert]').exists()).toBe(true);

    await wrapper.findAll('button').find((button) => button.text() === 'Disconnect')?.trigger('click');
    await settle();
    [...document.body.querySelectorAll('button')].reverse().find((button) => button.textContent?.trim() === 'Disconnect')?.click();
    await settle();
    expect(requestsTo(fetchMock, '/hevy/connection').some((call) => call.method === 'DELETE')).toBe(true);
  });

  it('shows a load error', async () => {
    const { wrapper } = await mountSection(() => jsonResponse({ statusCode: 403, message: 'Forbidden here' }, 403));
    expect(wrapper.text()).toContain('Forbidden here');
  });
});

describe('CompareWorkoutDialog', () => {
  it('suggests the previous workout, searches and picks another one', async () => {
    const suggestion = { ...workoutsPage.data[1]!, id: 'w0', title: 'Push Day', startedAt: '2026-09-21T18:00:00.000Z' };
    const other = { ...workoutsPage.data[0]!, id: 'w5', title: 'Legs', startedAt: '2026-09-25T18:00:00.000Z' };
    const fetchMock = stubFetch((url) => {
      if (url.includes('to=')) return { data: [suggestion], meta: workoutsPage.meta };
      if (url.includes('search=Legs')) return { data: [other], meta: workoutsPage.meta };
      if (url.includes('search=zzz')) return { data: [], meta: workoutsPage.meta };
      return { data: [workoutsPage.data[0], suggestion], meta: workoutsPage.meta };
    });
    const { default: CompareWorkoutDialog } = await import('@/components/workouts/CompareWorkoutDialog.vue');
    const { wrapper } = await mountWith(CompareWorkoutDialog, {
      props: { open: true, workout: { id: 'w1', title: 'Push Day', startedAt: '2026-09-28T18:00:00.000Z' } },
    });
    await settle();

    expect(document.body.textContent).toContain('Suggested');
    expect(document.body.textContent).toContain('Your previous workout with the same title.');
    expect(document.body.querySelector<HTMLInputElement>('input[value="w0"]')?.checked).toBe(true);

    const search = document.body.querySelector<HTMLInputElement>('#compare-search')!;
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 300));
    await settle();
    expect(document.body.textContent).toContain('No other workout matches.');

    search.value = 'Legs';
    search.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 300));
    await settle();
    document.body.querySelector<HTMLInputElement>('input[value="w5"]')?.click();
    await settle();
    [...document.body.querySelectorAll('button')].reverse().find((button) => button.textContent?.trim() === 'Compare')?.click();

    expect(wrapper.emitted('select')?.[0]).toEqual(['w5']);
    expect(requestsTo(fetchMock, 'search=Legs')).toHaveLength(1);

    [...document.body.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Cancel')?.click();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('reports a search error', async () => {
    stubFetch((url) => (url.includes('to=') ? { data: [], meta: workoutsPage.meta } : jsonResponse({ statusCode: 404, message: 'Gone away' }, 404)));
    const { default: CompareWorkoutDialog } = await import('@/components/workouts/CompareWorkoutDialog.vue');
    await mountWith(CompareWorkoutDialog, {
      props: { open: true, workout: { id: 'w1', title: 'Push Day', startedAt: '2026-09-28T18:00:00.000Z' } },
    });
    await settle();

    expect(document.body.textContent).toContain('Gone away');
  });
});
