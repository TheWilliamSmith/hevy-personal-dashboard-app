// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProgramBalance from '@/components/body/ProgramBalance.vue';
import { setLocale } from '@/i18n';
import BodyView from '@/views/BodyView.vue';
import { fakeApi, trainingBalance } from '../../../support/fake-api';
import { flushPromises, jsonResponse, mountWith, stubFetch } from '../../../support/mount';

class ResizeObserverStub {
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

const props = (overrides: Record<string, unknown> = {}) => ({
  balance: trainingBalance(),
  isLoading: false,
  rangeLabel: 'Last 30 days',
  neglectWeeks: 3,
  minWorkouts: 2,
  ...overrides,
});

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find((item) => item.text().trim() === label);
  if (!found) {
    throw new Error(`No button "${label}"`);
  }
  return found;
}

async function settle(): Promise<void> {
  for (let round = 0; round < 4; round += 1) {
    await flushPromises();
  }
}

function balanceUrls(fetchMock: ReturnType<typeof stubFetch>): string[] {
  return fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => url.includes('/stats/balance'));
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  setLocale('en');
});

describe('ProgramBalance', () => {
  it('shows the split with its verdicts', async () => {
    const { wrapper } = await mountWith(ProgramBalance, { props: props() });
    const text = wrapper.text();

    expect(text).toContain('Balance');
    expect(text).toContain('Push 57%, pull 29%, legs 14%');
    expect(text).toContain('Push to pull: 2 to 1');
    expect(text).toContain('Legs: 14% of the work');
    expect(text).toContain('More push than pull.');
    expect(text).toContain('Legs get little work.');
    expect(text).toContain('Core · 6 sets');
    expect(text).toContain('40 sets');
  });

  it('says when the split is balanced or too thin to judge', async () => {
    const balanced = trainingBalance({
      split: {
        push: 10,
        pull: 10,
        legs: 10,
        core: 0,
        totalSets: 30,
        pushPullRatio: 1,
        pushPullVerdict: 'BALANCED',
        lowerShare: 0.333,
        upperLowerVerdict: 'BALANCED',
      },
    });
    const { wrapper } = await mountWith(ProgramBalance, { props: props({ balance: balanced }) });
    expect(wrapper.text()).toContain('Push and pull are balanced.');
    expect(wrapper.text()).toContain('Upper and lower body are balanced.');
    expect(wrapper.text()).not.toContain('Core ·');

    const thin = trainingBalance({
      split: {
        push: 2,
        pull: 1,
        legs: 0,
        core: 0,
        totalSets: 3,
        pushPullRatio: null,
        pushPullVerdict: 'NOT_ENOUGH_DATA',
        lowerShare: null,
        upperLowerVerdict: 'NOT_ENOUGH_DATA',
      },
    });
    await wrapper.setProps({ balance: thin } as never);
    expect(wrapper.text()).toContain('Not enough sets in this period to judge.');
    expect(wrapper.text()).not.toContain('Push to pull');
  });

  it('lists neglected muscles and lets the user change the weeks', async () => {
    const { wrapper } = await mountWith(ProgramBalance, { props: props() });

    expect(wrapper.text()).toContain('No working set for 3 weeks or more');
    expect(wrapper.text()).toContain('Adductors');
    expect(wrapper.text()).toContain('Never trained');
    expect(wrapper.text()).toContain('Last trained 9 weeks ago');
    expect(wrapper.find('a[href*="muscles=CALVES"]').exists()).toBe(true);

    await button(wrapper, '8 wk').trigger('click');
    expect(wrapper.emitted('update:neglectWeeks')).toEqual([[8]]);
  });

  it('says when no muscle is neglected and shortens long lists', async () => {
    const none = trainingBalance({ neglected: { weeks: 4, muscles: [] } });
    const { wrapper } = await mountWith(ProgramBalance, { props: props({ balance: none, neglectWeeks: 4 }) });
    expect(wrapper.text()).toContain('Every muscle was trained in the last 4 weeks.');

    const many = trainingBalance({
      neglected: {
        weeks: 3,
        muscles: (['CHEST', 'BACK', 'TRAPS', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'QUADS'] as const).map(
          (muscleGroup) => ({ muscleGroup, lastTrainedAt: null, weeksSince: null }),
        ),
      },
    });
    await wrapper.setProps({ balance: many } as never);
    expect(wrapper.text()).toContain('and 2 more');
  });

  it('shows the regularity of the last 12 weeks', async () => {
    const { wrapper } = await mountWith(ProgramBalance, { props: props() });

    expect(wrapper.text()).toContain('weeks with 2+ workouts');
    expect(wrapper.findAll('ol li')).toHaveLength(12);
    expect(wrapper.find('ol').attributes('aria-label')).toBe('2 of 12 weeks with at least 2 workouts');
    expect(wrapper.findAll('ol li.bg-blue-500')).toHaveLength(2);
    expect(wrapper.text()).toContain('Week of 13 Jul: 0 workouts');

    await button(wrapper, '3+').trigger('click');
    expect(wrapper.emitted('update:minWorkouts')).toEqual([[3]]);
  });

  it('shows placeholders while loading', async () => {
    const { wrapper } = await mountWith(ProgramBalance, { props: props({ balance: null, isLoading: true }) });
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(2);
  });

  it('speaks French', async () => {
    setLocale('fr');
    const { wrapper } = await mountWith(ProgramBalance, { props: props() });
    expect(wrapper.text()).toContain('Plus de poussée que de tirage.');
    expect(wrapper.text()).toContain('Jamais travaillé');
  });
});

describe('Body page balance', () => {
  it('loads the balance with the saved settings and remembers changes', async () => {
    localStorage.setItem('hevy-dashboard.balance', JSON.stringify({ neglectWeeks: 4, minWorkouts: 3 }));
    const fetchMock = stubFetch(fakeApi());
    const { wrapper } = await mountWith(BodyView);
    await settle();

    expect(wrapper.text()).toContain('Coverage');
    expect(wrapper.text()).toContain('More push than pull.');
    expect(balanceUrls(fetchMock)[0]).toContain('neglectWeeks=4');
    expect(balanceUrls(fetchMock)[0]).toContain('minWorkouts=3');

    await button(wrapper, '2 wk').trigger('click');
    await settle();
    expect(balanceUrls(fetchMock).at(-1)).toContain('neglectWeeks=2');
    expect(JSON.parse(localStorage.getItem('hevy-dashboard.balance') ?? '{}')).toEqual({ neglectWeeks: 2, minWorkouts: 3 });
  });

  it('falls back to the defaults when the saved settings are unusable', async () => {
    localStorage.setItem('hevy-dashboard.balance', '{broken');
    const fetchMock = stubFetch(fakeApi());
    await mountWith(BodyView);
    await settle();

    expect(balanceUrls(fetchMock)[0]).toContain('neglectWeeks=3');
    expect(balanceUrls(fetchMock)[0]).toContain('minWorkouts=2');
  });

  it('shows an error with a retry when the balance cannot load', async () => {
    const fetchMock = stubFetch((url) =>
      url.includes('/stats/balance') ? jsonResponse({ statusCode: 500, message: 'Balance is down' }, 500) : fakeApi()(url),
    );
    const { wrapper } = await mountWith(BodyView);
    await settle();

    expect(wrapper.text()).toContain('The server failed to answer.');
    expect(wrapper.text()).toContain('Muscle map');
    await button(wrapper, 'Retry').trigger('click');
    await settle();
    expect(balanceUrls(fetchMock).length).toBeGreaterThanOrEqual(2);
  });
});
