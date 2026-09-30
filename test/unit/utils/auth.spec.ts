import { describe, expect, it } from 'vitest';

import { errorMessage, isEmail, passwordProblem, passwordStrength, safeRedirect } from '@/utils/auth';

describe('safeRedirect', () => {
  it('keeps an in-app path', () => {
    expect(safeRedirect('/?tab=workouts')).toBe('/?tab=workouts');
  });

  it.each([undefined, null, '', 'https://evil.test', '//evil.test/x', ['/']])('rejects %s', (value) => {
    expect(safeRedirect(value)).toBeNull();
  });
});

describe('errorMessage', () => {
  it('uses the error message, with a fallback', () => {
    expect(errorMessage(new Error('Invalid email or password.'))).toBe('Invalid email or password.');
    expect(errorMessage('boom')).toBe('Something went wrong. Try again.');
  });
});

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
