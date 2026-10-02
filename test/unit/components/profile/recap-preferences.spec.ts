// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import PreferencesPanel from '@/components/profile/PreferencesPanel.vue';
import { useToasts } from '@/composables/useToasts';
import { setLocale } from '@/i18n';
import type { UserProfile } from '@/types/profile';
import RecapUnsubscribeView from '@/views/auth/RecapUnsubscribeView.vue';
import { profile } from '../../../support/fake-api';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../../support/mount';

function prefs(overrides: Partial<UserProfile> = {}): UserProfile {
  const { stats: _stats, ...fields } = profile;
  return { ...fields, ...overrides };
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearToasts();
  setLocale('en');
  document.body.innerHTML = '';
});

describe('recap preferences', () => {
  it('chooses the frequency and the weekday', async () => {
    const { wrapper } = await mountWith(PreferencesPanel, { props: { profile: prefs(), isSaving: false } });

    expect(wrapper.text()).toContain('Every Monday, covering the 7 days before.');
    const weekday = wrapper.get('#recap-weekday');
    expect(weekday.findAll('option').map((option) => option.text())).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);

    await weekday.setValue('5');
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ recapWeekday: 5 }]);

    await wrapper.findAll('button').find((button) => button.text() === 'Monthly')?.trigger('click');
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ recapFrequency: 'monthly' }]);
  });

  it('chooses the day of the month', async () => {
    const { wrapper } = await mountWith(PreferencesPanel, {
      props: { profile: prefs({ recapFrequency: 'monthly', recapMonthDay: 15 }), isSaving: false },
    });

    expect(wrapper.text()).toContain('On day 15 of each month, covering the month before.');
    expect(wrapper.find('#recap-weekday').exists()).toBe(false);
    const day = wrapper.get('#recap-month-day');
    expect(day.findAll('option')).toHaveLength(28);

    await day.setValue('28');
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ recapMonthDay: 28 }]);
  });

  it('explains when recaps are off and names weekdays in French', async () => {
    setLocale('fr');
    const { wrapper } = await mountWith(PreferencesPanel, { props: { profile: prefs({ recapFrequency: 'off' }), isSaving: false } });

    expect(wrapper.text()).toContain('Aucun récap par e-mail.');
    expect(wrapper.find('#recap-weekday').exists()).toBe(false);
    expect(wrapper.find('#recap-month-day').exists()).toBe(false);

    await wrapper.setProps({ profile: prefs({ recapWeekday: 3 }) } as never);
    expect(wrapper.text()).toContain('Chaque mercredi');
  });

  it('sends a recap now and reports failures', async () => {
    const responses: unknown[] = [jsonResponse({ sentTo: 'william@example.com' }, 202), jsonResponse({ statusCode: 429, message: 'Too many attempts.' }, 429)];
    const fetchMock = stubFetch(() => responses.shift());
    const { wrapper } = await mountWith(PreferencesPanel, { props: { profile: prefs(), isSaving: false } });
    const send = wrapper.findAll('button').find((button) => button.text() === 'Send me a recap now');

    await send?.trigger('click');
    await flushPromises();
    expect(requestsTo(fetchMock, '/me/recap/send')).toEqual([{ method: 'POST', body: {} }]);
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Recap sent to william@example.com');

    await send?.trigger('click');
    await flushPromises();
    expect(useToasts().toasts.value.at(-1)).toMatchObject({ tone: 'error', title: 'Could not send the recap', description: 'Too many attempts.' });
  });
});

describe('RecapUnsubscribeView', () => {
  it('turns recaps off with the token from the link', async () => {
    const fetchMock = stubFetch(() => ({ unsubscribed: true }));
    const { wrapper } = await mountWith(RecapUnsubscribeView, { route: { name: 'recap-unsubscribe', query: { token: 'u1.sig' } } });
    await flushPromises();

    expect(requestsTo(fetchMock, '/recap/unsubscribe')).toEqual([{ method: 'POST', body: { token: 'u1.sig' } }]);
    expect(wrapper.text()).toContain('You are unsubscribed');
    expect(wrapper.text()).toContain('Open preferences');
  });

  it('says the link does not work when the token is refused or missing', async () => {
    stubFetch(() => jsonResponse({ statusCode: 400, message: 'This unsubscribe link is not valid.' }, 400));
    const { wrapper } = await mountWith(RecapUnsubscribeView, { route: { name: 'recap-unsubscribe', query: { token: 'bad' } } });
    await flushPromises();
    expect(wrapper.text()).toContain('This link does not work');

    const fetchMock = stubFetch(() => ({}));
    const { wrapper: empty } = await mountWith(RecapUnsubscribeView, { route: { name: 'recap-unsubscribe' } });
    await flushPromises();
    expect(empty.text()).toContain('This link does not work');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
