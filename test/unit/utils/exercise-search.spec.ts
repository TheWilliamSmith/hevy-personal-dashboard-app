import { describe, expect, it } from 'vitest';

import { searchExercises, type SearchableExercise } from '@/utils/exercise-search';

const EXERCISES: SearchableExercise[] = [
  { id: '1', name: 'Bicep Curl (Cable)', sessions: 12 },
  { id: '2', name: 'Curl Bar Row', sessions: 1 },
  { id: '3', name: 'Hammer Curl (Dumbbell)', sessions: 30 },
  { id: '4', name: 'Bench Press (Barbell)', sessions: 50 },
  { id: '5', name: 'Leg Curl (Machine)', sessions: 0 },
  { id: '6', name: 'Écarté (Machine)', sessions: 2 },
];

const names = (query: string, limit?: number) => searchExercises(EXERCISES, query, limit).map((exercise) => exercise.name);

describe('searchExercises', () => {
  it('lists names starting with the query first, then names with a word starting with it', () => {
    expect(names('Curl')).toEqual([
      'Curl Bar Row',
      'Hammer Curl (Dumbbell)',
      'Bicep Curl (Cable)',
      'Leg Curl (Machine)',
    ]);
  });

  it('ignores case, accents and surrounding spaces', () => {
    expect(names('  cURL b')).toEqual(['Curl Bar Row']);
    expect(names('ecar')).toEqual(['Écarté (Machine)']);
  });

  it('matches the start of a word, not the middle of one', () => {
    expect(names('url')).toEqual([]);
    expect(names('dumb')).toEqual(['Hammer Curl (Dumbbell)']);
  });

  it('shows the most performed exercises when nothing is typed', () => {
    expect(names('', 3)).toEqual(['Bench Press (Barbell)', 'Hammer Curl (Dumbbell)', 'Bicep Curl (Cable)']);
  });

  it('caps the number of results', () => {
    expect(names('c', 2)).toHaveLength(2);
  });
});
