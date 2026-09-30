import { describe, expect, it } from 'vitest';

import { isEmail, passwordProblem, passwordStrength } from '@/utils/auth';

describe('isEmail', () => {
  it.each(['alex@example.com', ' alex.lifts+hevy@mail.co.uk '])('accepts %s', (value) => {
    expect(isEmail(value)).toBe(true);
  });

  it.each(['', 'alex', 'alex@', 'alex@example', 'al ex@example.com'])('rejects "%s"', (value) => {
    expect(isEmail(value)).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('grades from empty to strong', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('short')).toBe(1);
    expect(passwordStrength('longenough')).toBe(2);
    expect(passwordStrength('Longenough1')).toBe(3);
    expect(passwordStrength('Longer-enough-1')).toBe(4);
  });
});

describe('passwordProblem', () => {
  it('explains what a weak password is missing', () => {
    expect(passwordProblem('abc')).toBe('Use at least 8 characters.');
    expect(passwordProblem('longenough')).toBe('Mix upper and lower case letters, digits or symbols.');
    expect(passwordProblem('Longenough1')).toBeNull();
  });
});
