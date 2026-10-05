// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '@/i18n';
import { applyPreferences } from '@/utils/preferences';
import CalculatorsView from '@/views/CalculatorsView.vue';
import ExerciseDetailView from '@/views/ExerciseDetailView.vue';
import { exerciseCard, exerciseCatalog, fakeApi } from '../../support/fake-api';
import { flushPromises, mountWith, stubFetch } from '../../support/mount';

async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await flushPromises();
  }
}

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find((item) => item.text().trim() === label);
  if (!found) {
    throw new Error(`No button "${label}"`);
  }
  return found;
}

const CATALOG = {
  ...exerciseCatalog,
  groups: [
    {
      ...exerciseCatalog.groups[0],
      exercises: [
        exerciseCard({ best1RM: 140 }),
        exerciseCard({ id: 'e3', name: 'Squat (Barbell)', slug: 'squat-barbell', best1RM: 160 }),
        exerciseCard({ id: 'e4', name: 'Plank', slug: 'plank', best1RM: null }),
        exerciseCard({ id: 'e5', name: 'Treadmill', slug: 'treadmill', kind: 'CARDIO', best1RM: null }),
      ],
    },
  ],
};

async function mountCalculators(query: Record<string, string> = {}) {
  stubFetch((url) => (url.includes('/exercises') ? CATALOG : fakeApi()(url)));
  const mounted = await mountWith(CalculatorsView, { route: { query: { tab: 'calculators', ...query } } });
  await settle();
  return mounted;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  setLocale('en');
});

describe('CalculatorsView', () => {
  it('estimates a one-rep max and sends it to the table', async () => {
    const { wrapper } = await mountCalculators();

    await wrapper.get('#calc-weight').setValue('100');
    await wrapper.get('#calc-reps').setValue('5');
    expect(wrapper.text()).toContain('116.7 kg');
    expect(wrapper.text()).toContain('Epley formula');

    await wrapper.get('#calc-reps').setValue('15');
    expect(wrapper.text()).toContain('Above 12 reps the estimate gets less reliable.');

    await wrapper.get('#calc-reps').setValue('5');
    await button(wrapper, 'Use in the table').trigger('click');
    expect((wrapper.get('#calc-max').element as HTMLInputElement).value).toBe('116.7');
    expect(wrapper.findAll('tbody tr')).toHaveLength(11);
    expect(wrapper.find('tbody tr').text()).toContain('117.5 kg');
  });

  it('fills the table from the best 1RM of the exercise in the address', async () => {
    const { wrapper } = await mountCalculators({ exercise: 'squat-barbell' });

    const options = wrapper.findAll('#calc-source option').map((option) => option.text());
    expect(options).toEqual(['A value I type', 'Bench Press (Barbell)', 'Squat (Barbell)']);
    expect(wrapper.text()).toContain('Best estimated 1RM: 160 kg');
    const rows = wrapper.findAll('tbody tr').map((row) => row.text());
    expect(rows[0]).toContain('160 kg');
    expect(rows[4]).toContain('80%');
    expect(rows[4]).toContain('127.5 kg');
    expect(rows[4]).toContain('8 reps');
  });

  it('shows an empty table without a 1RM', async () => {
    const { wrapper } = await mountCalculators();
    expect(wrapper.text()).toContain('Type a 1RM or pick an exercise to see your loads.');
  });

  it('works in pounds with pound bars, plates and 5 lb steps', async () => {
    applyPreferences({ weightUnit: 'lb', weekStart: 'monday' });
    const { wrapper } = await mountCalculators({ exercise: 'bench-press-barbell' });

    expect(wrapper.text()).toContain('Best estimated 1RM: 308.6 lb');
    expect(wrapper.findAll('tbody tr')[0]?.text()).toContain('310 lb');
    expect(wrapper.text()).toContain('45 lb');

    await wrapper.get('#calc-target').setValue('225');
    expect(wrapper.text()).toContain('Each side: 45 + 45');
    expect(wrapper.text()).toContain('Total on the bar: 225 lb');
  });

  it('lists the plates per side and follows the plates you have', async () => {
    const { wrapper } = await mountCalculators();
    expect(wrapper.text()).toContain('Type a target weight to see the plates.');

    await wrapper.get('#calc-target').setValue('100');
    expect(wrapper.text()).toContain('Each side: 25 + 15');
    expect(wrapper.text()).toContain('Total on the bar: 100 kg');

    await button(wrapper, '25 kg').trigger('click');
    expect(wrapper.text()).toContain('Each side: 20 + 20');

    await wrapper.get('#calc-target').setValue('101');
    expect(wrapper.text()).toContain('1 kg missing');

    await wrapper.get('#calc-target').setValue('15');
    expect(wrapper.text()).toContain('The target is lighter than the 20 kg bar.');

    await wrapper.get('#calc-target').setValue('20');
    expect(wrapper.text()).toContain('Each side: nothing, the bar alone');

    const plate15 = () => wrapper.findAll('button').filter((item) => item.text() === '15 kg').at(-1);
    await plate15()?.trigger('click');
    expect(plate15()?.attributes('aria-pressed')).toBe('false');
    await wrapper.get('#calc-target').setValue('50');
    expect(wrapper.text()).toContain('Each side: 10 + 5');
  });

  it('loads a row of the table into the plate calculator', async () => {
    const { wrapper } = await mountCalculators({ exercise: 'bench-press-barbell' });

    await wrapper.findAll('button').find((item) => item.attributes('aria-label') === 'Show the plates for 140 kg')?.trigger('click');
    expect((wrapper.get('#calc-target').element as HTMLInputElement).value).toBe('140');
    expect(wrapper.text()).toContain('Each side: 25 + 25 + 10');
  });

  it('speaks French', async () => {
    setLocale('fr');
    const { wrapper } = await mountCalculators();
    expect(wrapper.text()).toContain('Disques par côté');
  });
});

describe('exercise page', () => {
  it('links to the calculators with the exercise', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(ExerciseDetailView, { route: { query: { tab: 'exercises', exercise: 'bench-press-barbell' } } });
    await settle();

    const link = wrapper.findAll('a').find((item) => item.text() === 'Plan my loads');
    expect(link?.attributes('href')).toContain('tab=calculators');
    expect(link?.attributes('href')).toContain('exercise=bench-press-barbell');
  });
});
