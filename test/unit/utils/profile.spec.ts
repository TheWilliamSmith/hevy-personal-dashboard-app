import { describe, expect, it } from 'vitest';

import { initialsOf } from '@/utils/profile';

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
