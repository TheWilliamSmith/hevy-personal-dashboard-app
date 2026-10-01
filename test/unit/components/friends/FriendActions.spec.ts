// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import FriendActions from '@/components/friends/FriendActions.vue';
import { useToasts } from '@/composables/useToasts';
import type { UserCard } from '@/types/friends';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../../support/mount';

function card(overrides: Partial<UserCard> = {}): UserCard {
  return { id: 'u2', username: 'lea.martin', displayName: 'Léa', avatarUrl: null, friendship: 'none', requestId: null, ...overrides };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  clearToasts();
});

describe('FriendActions', () => {
  it('sends a request and reports the new state', async () => {
    const fetchMock = stubFetch(() => jsonResponse(card({ friendship: 'outgoing', requestId: 'r1' }), 201));
    const { wrapper } = await mountWith(FriendActions, { props: { user: card() } });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(requestsTo(fetchMock, '/friends/requests')).toEqual([{ method: 'POST', body: { username: 'lea.martin' } }]);
    expect(wrapper.emitted('changed')?.[0]?.[0]).toMatchObject({ friendship: 'outgoing' });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Friend request sent to Léa');
  });

  it('says you became friends when the other person had already asked', async () => {
    stubFetch(() => jsonResponse(card({ friendship: 'friends' }), 201));
    const { wrapper } = await mountWith(FriendActions, { props: { user: card() } });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(useToasts().toasts.value.at(-1)?.title).toBe('You and Léa are now friends');
  });

  it('shows a waiting request with a cancel button', async () => {
    const fetchMock = stubFetch(() => ({ id: 'r1' }));
    const { wrapper } = await mountWith(FriendActions, { props: { user: card({ friendship: 'outgoing', requestId: 'r1' }) } });

    expect(wrapper.text()).toContain('Request sent');
    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(requestsTo(fetchMock, '/friends/requests/r1')).toEqual([{ method: 'DELETE', body: undefined }]);
    expect(wrapper.emitted('changed')?.[0]?.[0]).toMatchObject({ friendship: 'none' });
  });

  it('accepts or declines an incoming request', async () => {
    const fetchMock = stubFetch((url) => (url.endsWith('/accept') ? card({ friendship: 'friends' }) : { id: 'r9' }));
    const { wrapper } = await mountWith(FriendActions, { props: { user: card({ friendship: 'incoming', requestId: 'r9' }), compact: true } });

    const [accept, decline] = wrapper.findAll('button');
    await decline?.trigger('click');
    await flushPromises();
    await accept?.trigger('click');
    await flushPromises();

    expect(requestsTo(fetchMock, '/decline')).toHaveLength(1);
    expect(requestsTo(fetchMock, '/accept')).toHaveLength(1);
    expect(wrapper.emitted('changed')).toHaveLength(2);
  });

  it('asks before removing a friend', async () => {
    const fetchMock = stubFetch(() => ({ id: 'f1' }));
    const { wrapper } = await mountWith(FriendActions, { props: { user: card({ friendship: 'friends' }) } });

    expect(wrapper.text()).toContain('Friends');
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('Remove Léa from your friends?');

    const confirm = [...document.body.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Remove' && button !== wrapper.get('button').element);
    confirm?.click();
    await flushPromises();

    expect(requestsTo(fetchMock, '/friends/u2')).toEqual([{ method: 'DELETE', body: undefined }]);
  });

  it('reports a failure without changing the state', async () => {
    stubFetch(() => jsonResponse({ statusCode: 409, message: 'You are already friends.' }, 409));
    const { wrapper } = await mountWith(FriendActions, { props: { user: card() } });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('changed')).toBeUndefined();
    expect(useToasts().toasts.value.at(-1)).toMatchObject({ tone: 'error', description: 'You are already friends.' });
  });

  it('shows nothing on your own card', async () => {
    const { wrapper } = await mountWith(FriendActions, { props: { user: card({ friendship: 'self' }) } });
    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});
