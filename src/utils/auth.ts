import { t } from '@/i18n';
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

export function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

export function errorMessage(caught: unknown): string {
  return caught instanceof Error && caught.message ? caught.message : t('common.somethingWrong');
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return t('validation.passwordLength', { min: MIN_PASSWORD_LENGTH });
  }
  if (passwordStrength(password) < 3) {
    return t('validation.passwordVariety');
  }
  return null;
}
