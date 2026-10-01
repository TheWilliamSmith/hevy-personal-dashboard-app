import { computed } from 'vue';
import { createI18n } from 'vue-i18n';

import { en } from './locales/en';
import { fr } from './locales/fr';

export type Locale = 'en' | 'fr';

export const LOCALES: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const STORAGE_KEY = 'hevy-dashboard.locale';
const INTL_TAGS: Readonly<Record<Locale, string>> = {
  en: 'en-GB',
  fr: 'fr-FR',
};

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'fr';
}

function storedLocale(): Locale {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : 'en';
  } catch {
    return 'en';
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: storedLocale(),
  fallbackLocale: 'en',
  messages: { en, fr },
  missingWarn: false,
  fallbackWarn: false,
});

export type TranslateParams = Record<string, unknown>;

interface Translator {
  t(key: string, params: TranslateParams, plural?: number): string;
}

const translator = i18n.global as unknown as Translator;

export function t(key: string, params: TranslateParams = {}, plural?: number): string {
  return plural === undefined ? translator.t(key, params) : translator.t(key, params, plural);
}

export const locale = computed<Locale>(() => (isLocale(i18n.global.locale.value) ? i18n.global.locale.value : 'en'));

export function intlLocale(): string {
  return INTL_TAGS[locale.value];
}

export function translated<K extends string>(
  keys: readonly K[],
  path: (key: K) => string,
): Readonly<Record<K, string>> {
  const record = {} as Record<K, string>;
  for (const key of keys) {
    Object.defineProperty(record, key, {
      enumerable: true,
      get: () => t(path(key)),
    });
  }
  return record;
}

function applyDocumentLanguage(next: Locale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
}

export function setLocale(next: Locale): void {
  i18n.global.locale.value = next;
  applyDocumentLanguage(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    return;
  }
}

applyDocumentLanguage(locale.value);
