// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'hevy-dashboard.locale';

async function freshModule() {
  vi.resetModules();
  return import('@/i18n');
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = '';
});

describe('locale', () => {
  it('starts in English when nothing is stored', async () => {
    const { locale, intlLocale, t } = await freshModule();

    expect(locale.value).toBe('en');
    expect(intlLocale()).toBe('en-GB');
    expect(document.documentElement.lang).toBe('en');
    expect(t('nav.workouts')).toBe('Workouts');
  });

  it('starts in the stored language', async () => {
    localStorage.setItem(STORAGE_KEY, 'fr');
    const { locale, t } = await freshModule();

    expect(locale.value).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(t('nav.workouts')).toBe('Séances');
  });

  it('ignores an unknown stored language', async () => {
    localStorage.setItem(STORAGE_KEY, 'de');
    const { locale } = await freshModule();

    expect(locale.value).toBe('en');
  });

  it('switches language, remembers it and updates the page language', async () => {
    const { setLocale, locale, intlLocale, t } = await freshModule();

    setLocale('fr');

    expect(locale.value).toBe('fr');
    expect(intlLocale()).toBe('fr-FR');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(t('common.pageOf', { page: 2, total: 5 })).toBe('Page 2 sur 5');
  });

  it('picks the plural form from the count', async () => {
    const { t } = await freshModule();

    expect(t('workouts.setCount', { count: 1 }, 1)).toBe('1 set');
    expect(t('workouts.setCount', { count: 3 }, 3)).toBe('3 sets');
  });

  it('keeps translated labels in step with the language', async () => {
    const { setLocale } = await freshModule();
    const { MUSCLE_LABELS } = await import('@/constants/muscles');
    const { STATUS_STYLES } = await import('@/constants/progress');

    expect(MUSCLE_LABELS.CHEST).toBe('Chest');
    expect(STATUS_STYLES.REGRESSING.label).toBe('Regressing');

    setLocale('fr');

    expect(MUSCLE_LABELS.CHEST).toBe('Pectoraux');
    expect(STATUS_STYLES.REGRESSING.label).toBe('En baisse');
  });
});
