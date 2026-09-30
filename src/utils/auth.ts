export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const MIN_PASSWORD_LENGTH = 8;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function passwordStrength(password: string): PasswordStrength {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return password.length === 0 ? 0 : 1;
  }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (password.length >= 12 && variety >= 3) {
    return 4;
  }
  return variety >= 3 ? 3 : 2;
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (passwordStrength(password) < 3) {
    return 'Mix upper and lower case letters, digits or symbols.';
  }
  return null;
}
