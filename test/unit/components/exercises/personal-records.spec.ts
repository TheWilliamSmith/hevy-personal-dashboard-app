// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import PersonalRecords from '@/components/exercises/PersonalRecords.vue';
import type { ExerciseRecords } from '@/types/exercises';
import { mountWith } from '../../../support/mount';

const NONE: ExerciseRecords = {
  maxWeight: null,
  best1RM: null,
  maxVolumeSession: null,
  maxReps: null,
  longestDistanceKm: null,
  longestDurationSec: null,
  bestPaceMinPerKm: null,
};

const AT = { date: '2026-09-28T18:00:00.000Z', workoutId: 'w1' };

describe('PersonalRecords', () => {
  it('shows the distance, duration and pace records of a cardio exercise', async () => {
    const { wrapper } = await mountWith(PersonalRecords, {
      props: {
        records: {
          ...NONE,
          longestDistanceKm: { ...AT, value: 10.5 },
          longestDurationSec: { ...AT, value: 3600 },
          bestPaceMinPerKm: { ...AT, value: 5.25 },
        },
        kind: 'CARDIO',
      },
    });

    expect(wrapper.text()).toContain('Longest distance');
    expect(wrapper.text()).toContain('Longest duration');
    expect(wrapper.text()).toContain('Best pace');
    expect(wrapper.text()).not.toContain('Estimated 1RM');
  });

  it('leaves out the set details it does not know', async () => {
    const { wrapper } = await mountWith(PersonalRecords, {
      props: {
        records: {
          ...NONE,
          best1RM: { ...AT, value: 100, weightKg: null, reps: null },
          maxWeight: { ...AT, weightKg: 90, reps: null },
          maxReps: { ...AT, reps: 20, weightKg: null },
        },
        kind: 'STRENGTH',
      },
    });

    expect(wrapper.text()).toContain('Estimated 1RM');
    expect(wrapper.text()).not.toContain('from ');
    expect(wrapper.text()).toContain('× — reps');
    expect(wrapper.text()).toContain('20 reps');
    expect(wrapper.text()).not.toContain('at ');
    expect(wrapper.text()).not.toContain('Best session volume');
  });

  it('says when there is no record', async () => {
    const { wrapper } = await mountWith(PersonalRecords, { props: { records: NONE, kind: 'CARDIO' } });
    expect(wrapper.text()).toContain('No record yet.');
  });
});
