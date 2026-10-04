// @vitest-environment jsdom
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import GoalFormDialog from '@/components/goals/GoalFormDialog.vue';
import type { GoalSubmission } from '@/components/goals/GoalFormDialog.vue';
import TrainingCalendar from '@/components/home/TrainingCalendar.vue';
import ProfileForm from '@/components/profile/ProfileForm.vue';
import WorkoutRow from '@/components/workouts/WorkoutRow.vue';
import type { UserProfile } from '@/types/profile';
import { applyPreferences } from '@/utils/preferences';
import { goal, profile, workoutSummary } from '../../support/fake-api';
import { flushPromises, mountWith } from '../../support/mount';

const POUNDS = { weightUnit: 'lb', weekStart: 'monday' } as const;

function rowLabels(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('span')
    .filter((span) => span.classes().includes('items-center') && span.classes().includes('text-[11px]'))
    .map((span) => span.text());
}

function type(selector: string, value: string): void {
  const input = document.body.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`No input ${selector}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('weight unit in the interface', () => {
  it('switches a workout volume to pounds without reloading', async () => {
    const { wrapper } = await mountWith(WorkoutRow, { props: { workout: workoutSummary(), backQuery: {} } });
    expect(wrapper.text()).toContain('5,200 kg');

    applyPreferences(POUNDS);
    await nextTick();

    expect(wrapper.text()).toContain('11,464 lb');
    expect(wrapper.text()).not.toContain('kg');
  });

  it('asks for a goal target in pounds and saves it in kilograms', async () => {
    applyPreferences(POUNDS);
    const submissions: GoalSubmission[] = [];
    const { wrapper } = await mountWith(GoalFormDialog, {
      props: { open: false, goal: goal({ target: 120 }), submit: async (submission: GoalSubmission) => void submissions.push(submission) },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();

    expect(document.body.textContent).toContain('Target (lb)');
    expect(document.body.querySelector<HTMLInputElement>('#goal-target')?.value).toBe('264.6');

    type('#goal-target', '225');
    [...document.body.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Save goal')?.click();
    await flushPromises();

    expect(submissions).toEqual([{ kind: 'update', id: 'g1', changes: { target: 102.06, deadline: '2026-12-31' } }]);
  });

  it('shows the bodyweight in pounds and saves it in kilograms', async () => {
    applyPreferences(POUNDS);
    const { wrapper } = await mountWith(ProfileForm, { props: { profile: { ...profile }, isSaving: false } });

    expect(wrapper.text()).toContain('Bodyweight (lb)');
    expect(wrapper.find<HTMLInputElement>('#profile-bodyweight').element.value).toBe('176');

    await wrapper.find('#profile-bodyweight').setValue('180');
    await wrapper.find('form').trigger('submit');

    const saved = wrapper.emitted('save')?.[0]?.[0] as UserProfile;
    expect(saved.bodyweightKg).toBe(81.6);
  });
});

describe('week start in the interface', () => {
  it('starts the calendar rows on Monday, then on Sunday once chosen', async () => {
    const { wrapper } = await mountWith(TrainingCalendar, { props: { weekCount: 4, days: [], isLoading: false, error: null } });
    expect(rowLabels(wrapper)).toEqual(['Mon', '', 'Wed', '', 'Fri', '', '']);

    applyPreferences({ weightUnit: 'kg', weekStart: 'sunday' });
    await nextTick();

    expect(rowLabels(wrapper)).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
  });
});
