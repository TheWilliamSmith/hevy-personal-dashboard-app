// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BodyView from '@/views/BodyView.vue';
import DashboardView from '@/views/DashboardView.vue';
import DataView from '@/views/DataView.vue';
import ExerciseDetailView from '@/views/ExerciseDetailView.vue';
import ExercisesView from '@/views/ExercisesView.vue';
import GoalsView from '@/views/GoalsView.vue';
import ProgressView from '@/views/ProgressView.vue';
import TrophyRoomView from '@/views/TrophyRoomView.vue';
import UserPageView from '@/views/UserPageView.vue';
import WorkoutCompareView from '@/views/WorkoutCompareView.vue';
import WorkoutDetailView from '@/views/WorkoutDetailView.vue';
import WorkoutsView from '@/views/WorkoutsView.vue';
import { fakeApi } from '../../support/fake-api';
import { flushPromises, jsonResponse, mountWith, stubFetch } from '../../support/mount';

class ResizeObserverStub {
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

async function settle(): Promise<void> {
  for (let round = 0; round < 4; round += 1) {
    await flushPromises();
  }
}

describe('views', () => {
  it('renders the dashboard', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(DashboardView);
    await settle();

    expect(wrapper.text()).toContain('Key metrics');
    expect(wrapper.text()).toContain('Training calendar');
    expect(wrapper.text()).toContain('Muscle focus');
  });

  it('renders the body page and switches the metric and figure view', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(BodyView);
    await settle();

    expect(wrapper.text()).toContain('Muscle map');
    expect(wrapper.text()).toContain('Ranking');
    for (const label of ['Volume', 'Reps', 'Front', 'Back', 'Both']) {
      const button = wrapper.findAll('button').find((item) => item.text() === label);
      await button?.trigger('click');
    }
    await settle();
    expect(wrapper.text()).toContain('Highlights');
  });

  it('renders the progress page, filters by status and opens the settings', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(ProgressView);
    await settle();

    expect(wrapper.text()).toContain('Squat (Barbell)');
    const plateau = wrapper.findAll('button').find((item) => item.text().includes('Plateau'));
    await plateau?.trigger('click');
    await wrapper.get('[aria-label="Assessment settings"]').trigger('click');
    await settle();
    expect(wrapper.text()).toContain('How exercises are classified');

    const muted = wrapper.findAll('button').find((item) => item.text().startsWith('Muted'));
    await muted?.trigger('click');
    expect(wrapper.text()).toContain('Injury');
  });

  it('renders the goals page with active and archived goals', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(GoalsView);
    await settle();

    expect(wrapper.text()).toContain('Bench Press (Barbell) · estimated 1RM');
    const archived = wrapper.findAll('button').find((item) => item.text().startsWith('Archived goals'));
    await archived?.trigger('click');
    expect(wrapper.findAll('[aria-label="Restore goal"]')).toHaveLength(1);
  });

  it('renders the trophy room and filters a family', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(TrophyRoomView);
    await settle();

    expect(wrapper.text()).toContain('Workouts logged');
    expect(wrapper.text()).toContain('Hidden achievement');
    const family = wrapper.findAll('button').find((item) => item.text().includes('Oddity'));
    await family?.trigger('click');
    await settle();
    expect(wrapper.text()).toContain('Night Owl');
  });

  it('renders the workout list', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(WorkoutsView);
    await settle();

    expect(wrapper.text()).toContain('All workouts');
    expect(wrapper.text()).toContain('Push Day');
  });

  it('renders a workout and opens the comparison picker', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(WorkoutDetailView, { route: { query: { tab: 'workouts', workout: 'w1' } } });
    await settle();

    expect(wrapper.text()).toContain('Felt strong.');
    expect(wrapper.text()).toContain('Superset 1');
    await wrapper.findAll('button').find((item) => item.text() === 'Compare')?.trigger('click');
    await settle();
    expect(document.body.textContent).toContain('Compare with another workout');
  });

  it('shows a missing workout', async () => {
    stubFetch((url) => (url.includes('/workouts/') ? jsonResponse({ statusCode: 404, message: 'Not found' }, 404) : {}));
    const { wrapper } = await mountWith(WorkoutDetailView, { route: { query: { tab: 'workouts', workout: 'nope' } } });
    await settle();

    expect(wrapper.text()).toContain('This workout does not exist.');
  });

  it('compares two workouts', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(WorkoutCompareView, { route: { query: { tab: 'workouts', workout: 'w1', compare: 'w0' } } });
    await settle();

    expect(wrapper.text()).toContain('Overview');
    expect(wrapper.text()).toContain('Shared exercises');
    expect(wrapper.text()).toContain('Bench Press (Barbell)');
    await wrapper.findAll('button').find((item) => item.text().includes('Change workout'))?.trigger('click');
    await settle();
    expect(document.body.textContent).toContain('Compare with another workout');
  });

  it('refuses to compare a workout with itself', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(WorkoutCompareView, { route: { query: { tab: 'workouts', workout: 'w1', compare: 'w1' } } });
    await settle();

    expect(wrapper.text()).toContain('Pick a different workout to compare with.');
  });

  it('renders the exercise catalog', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(ExercisesView);
    await settle();

    expect(wrapper.text()).toContain('Most trained');
    expect(wrapper.text()).toContain('Treadmill');
    expect(wrapper.text()).toContain('Custom');
  });

  it('renders an exercise and opens its dialogs', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(ExerciseDetailView, { route: { query: { tab: 'exercises', exercise: 'bench-press-barbell' } } });
    await settle();

    expect(wrapper.text()).toContain('Personal records');
    expect(wrapper.text()).toContain('Session history');
    await wrapper.findAll('button').find((item) => item.text() === 'Edit classification')?.trigger('click');
    await settle();
    expect(document.body.textContent).toContain('Primary muscle group');
  });

  it('renders another user’s page', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(UserPageView, { route: { query: { tab: 'friends', user: 'lea.martin' } } });
    await settle();

    expect(wrapper.text()).toContain('Léa Martin');
    expect(wrapper.text()).toContain('Century Squat');
    expect(wrapper.text()).toContain('1 exercise');
  });

  it('shows an unknown user', async () => {
    stubFetch((url) => (url.includes('/users/') ? jsonResponse({ statusCode: 404, message: 'No user' }, 404) : {}));
    const { wrapper } = await mountWith(UserPageView, { route: { query: { tab: 'friends', user: 'ghost' } } });
    await settle();

    expect(wrapper.text()).toContain('This user does not exist.');
  });

  it('renders the data page', async () => {
    stubFetch(fakeApi());
    const { wrapper } = await mountWith(DataView);
    await settle();

    expect(wrapper.text()).toContain('Hevy connection');
    expect(wrapper.text()).toContain('Sync history');
    expect(wrapper.text()).toContain('CSV import');
  });
});
