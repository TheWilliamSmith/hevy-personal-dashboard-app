import { describe, expect, it } from 'vitest';

import { initialsOf, isUsername, normalizeUsername, suggestUsername } from '@/utils/profile';

describe('initialsOf', () => {
  it('takes the first letter of the first and last words', () => {
    expect(initialsOf('Alex Martin')).toBe('AM');
    expect(initialsOf('  jean  claude  van damme ')).toBe('JD');
  });

  it('uses a single letter for a single word', () => {
    expect(initialsOf('lifter')).toBe('L');
  });

  it('falls back to a question mark for an empty name', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('usernames', () => {
  it('normalizes a typed handle', () => {
    expect(normalizeUsername('  @Alex.Lifts ')).toBe('alex.lifts');
  });

  it.each(['alex.lifts', 'a_1', '@Alex_99'])('accepts %s', (value) => {
    expect(isUsername(value)).toBe(true);
  });

  it.each(['al', 'alex lifts', 'alex-lifts', 'x'.repeat(31)])('rejects %s', (value) => {
    expect(isUsername(value)).toBe(false);
  });

  it('suggests a handle from a display name', () => {
    expect(suggestUsername('Élodie Martin')).toBe('elodie.martin');
    expect(suggestUsername('  Jean-Claude  Van Damme! ')).toBe('jeanclaude.van.damme');
    expect(suggestUsername('')).toBe('');
  });
});
