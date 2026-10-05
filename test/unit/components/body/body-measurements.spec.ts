// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BodyMeasurements from '@/components/body/BodyMeasurements.vue';
import PersonalRecords from '@/components/exercises/PersonalRecords.vue';
import { useToasts } from '@/composables/useToasts';
import { applyPreferences } from '@/utils/preferences';
import ExerciseDetailView from '@/views/ExerciseDetailView.vue';
import { exerciseDetail, fakeApi, measurements } from '../../../support/fake-api';
import { clearToasts, flushPromises, jsonResponse, mountWith, requestsTo, stubFetch } from '../../../support/mount';

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

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find((item) => item.text().trim() === label || item.attributes('aria-label') === label);
  if (!found) {
    throw new Error(`No button "${label}"`);
  }
  return found;
}

function bodyButton(label: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')].reverse().find((item) => item.textContent?.trim() === label);
  if (!found) {
    throw new Error(`No button "${label}" in the page`);
  }
  return found;
}

function type(selector: string, value: string): void {
  const input = document.body.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`No input ${selector}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearToasts();
  document.body.innerHTML = '';
});

describe('BodyMeasurements', () => {
  it('shows the latest value, the change and the recent entries', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    expect(wrapper.text()).toContain('Bodyweight and measurements');
    expect(wrapper.text()).toContain('79.8 kg');
    expect(wrapper.text()).toContain('Change since 1 Sept 2026');
    expect(wrapper.text()).toContain('−0.7 kg');
    expect(wrapper.text()).toContain('Weight 82 kg · Arms 37 cm · Waist 86 cm');

    await button(wrapper, 'Waist').trigger('click');
    expect(wrapper.text()).toContain('84.5 cm');
    expect(wrapper.text()).toContain('−1.5 cm');

    await button(wrapper, 'Chest').trigger('click');
    expect(wrapper.text()).not.toContain('Change since');
  });

  it('shows the weight in pounds when the user chose them', async () => {
    applyPreferences({ weightUnit: 'lb', weekStart: 'monday' });
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    expect(wrapper.text()).toContain('175.9 lb');
    expect(wrapper.text()).toContain('−1.5 lb');
  });

  it('invites a first entry when there is none', async () => {
    stubFetch(fakeApi({ '/me/measurements': [] }));
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    expect(wrapper.text()).toContain('No weight entry yet.');
    expect(wrapper.text()).toContain('No entry yet.');
  });

  it('adds an entry typed in pounds and saves it in kilograms', async () => {
    applyPreferences({ weightUnit: 'lb', weekStart: 'monday' });
    const fetchMock = stubFetch((url, init) => (init?.method === 'POST' ? { id: 'm9', measuredOn: '2026-10-04', weightKg: 79.4 } : fakeApi()(url)));
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    await button(wrapper, 'Add entry').trigger('click');
    await settle();
    expect(document.body.textContent).toContain('Weight (lb)');

    bodyButton('Add entry').click();
    await settle();
    expect(document.body.textContent).toContain('Enter a weight or at least one measurement.');

    type('#measurement-date', '2026-10-04');
    type('#measurement-weightKg', '175');
    type('#measurement-waistCm', '83,5');
    bodyButton('Add entry').click();
    await settle();

    expect(requestsTo(fetchMock, '/me/measurements').find((call) => call.method === 'POST')?.body).toEqual({
      measuredOn: '2026-10-04',
      weightKg: 79.4,
      armCm: null,
      waistCm: 83.5,
      thighCm: null,
      chestCm: null,
    });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Entry added');
  });

  it('flags a bad number and shows the API error on its field', async () => {
    stubFetch((url, init) =>
      init?.method === 'POST'
        ? jsonResponse({ statusCode: 409, message: 'There is already an entry for this day. Edit it instead.', field: 'measuredOn' }, 409)
        : fakeApi()(url),
    );
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();
    await button(wrapper, 'Add entry').trigger('click');
    await settle();

    type('#measurement-armCm', 'big');
    bodyButton('Add entry').click();
    await settle();
    expect(document.body.textContent).toContain('Enter a number above zero.');

    type('#measurement-armCm', '38');
    bodyButton('Add entry').click();
    await settle();
    expect(document.body.textContent).toContain('There is already an entry for this day. Edit it instead.');
  });

  it('edits an entry with its values filled in', async () => {
    const fetchMock = stubFetch((url, init) => (init?.method === 'PATCH' ? { ...measurements[2], weightKg: 79.2 } : fakeApi()(url)));
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    await button(wrapper, 'Edit the entry of 28 Sept 2026').trigger('click');
    await settle();
    expect(document.body.querySelector<HTMLInputElement>('#measurement-weightKg')?.value).toBe('79.8');
    expect(document.body.querySelector<HTMLInputElement>('#measurement-armCm')?.value).toBe('37.5');

    type('#measurement-weightKg', '79.2');
    bodyButton('Save entry').click();
    await settle();

    const call = requestsTo(fetchMock, '/me/measurements/m3').find((item) => item.method === 'PATCH');
    expect(call?.body).toMatchObject({ measuredOn: '2026-09-28', weightKg: 79.2, armCm: 37.5 });
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Entry updated');
  });

  it('deletes an entry after confirmation', async () => {
    const fetchMock = stubFetch((url, init) => (init?.method === 'DELETE' ? { id: 'm3' } : fakeApi()(url)));
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    await button(wrapper, 'Delete the entry of 28 Sept 2026').trigger('click');
    await settle();
    expect(document.body.textContent).toContain('The entry of 28 Sept 2026 will be removed.');
    bodyButton('Delete').click();
    await settle();

    expect(requestsTo(fetchMock, '/me/measurements/m3').map((call) => call.method)).toContain('DELETE');
    expect(useToasts().toasts.value.at(-1)?.title).toBe('Entry deleted');
  });

  it('shows an error with a retry', async () => {
    stubFetch((url) => (url.includes('/me/measurements') ? jsonResponse({ statusCode: 400, message: 'Measurements are down' }, 400) : fakeApi()(url)));
    const { wrapper } = await mountWith(BodyMeasurements);
    await settle();

    expect(wrapper.text()).toContain('Measurements are down');
    expect(wrapper.text()).toContain('Retry');
  });
});

describe('relative strength', () => {
  it('shows the estimated 1RM against the bodyweight of that day', async () => {
    const { wrapper } = await mountWith(PersonalRecords, {
      props: { records: exerciseDetail.records, kind: 'STRENGTH', bodyweightKg: 79.8 },
    });

    expect(wrapper.text()).toContain('Relative strength');
    expect(wrapper.text()).toContain('1.28× bodyweight');
    expect(wrapper.text()).toContain('at 79.8 kg bodyweight');
  });

  it('is left out without a bodyweight', async () => {
    const { wrapper } = await mountWith(PersonalRecords, { props: { records: exerciseDetail.records, kind: 'STRENGTH', bodyweightKg: null } });
    expect(wrapper.text()).not.toContain('Relative strength');
  });

  it('uses the measurement of the day of the record on the exercise page', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(ExerciseDetailView, { route: { query: { tab: 'exercises', exercise: 'bench-press-barbell' } } });
    await settle();

    expect(wrapper.text()).toContain('1.28× bodyweight');
  });
});

describe('pages', () => {
  it('keeps measurements on their own tab, away from the Body page', async () => {
    stubFetch(fakeApi());
    const { default: BodyView } = await import('@/views/BodyView.vue');
    const body = await mountWith(BodyView);
    await settle();
    expect(body.wrapper.text()).toContain('Muscle map');
    expect(body.wrapper.text()).not.toContain('Bodyweight and measurements');

    const { default: MeasurementsView } = await import('@/views/MeasurementsView.vue');
    const page = await mountWith(MeasurementsView);
    await settle();
    expect(page.wrapper.text()).toContain('Bodyweight and measurements');
  });
});
