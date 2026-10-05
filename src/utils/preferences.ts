import { computed, ref, watchEffect } from 'vue';

import type { ThemePreference, WeekStart, WeightUnit } from '@/types/profile';

const STORAGE_KEY = 'hevy-dashboard.preferences';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export type ResolvedTheme = 'light' | 'dark';

export interface DisplayPreferences {
  weightUnit: WeightUnit;
  weekStart: WeekStart;
}

interface StoredPreferences extends DisplayPreferences {
  theme: ThemePreference;
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function stored(): StoredPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<StoredPreferences> | null;
    return {
      weightUnit: parsed?.weightUnit === 'lb' ? 'lb' : 'kg',
      weekStart: parsed?.weekStart === 'sunday' ? 'sunday' : 'monday',
      theme: isTheme(parsed?.theme) ? parsed.theme : 'system',
    };
  } catch {
    return { weightUnit: 'kg', weekStart: 'monday', theme: 'system' };
  }
}

function darkQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
}

const initial = stored();

export const weightUnit = ref<WeightUnit>(initial.weightUnit);
export const weekStart = ref<WeekStart>(initial.weekStart);
export const theme = ref<ThemePreference>(initial.theme);

const query = darkQuery();
const systemDark = ref(query?.matches ?? true);
query?.addEventListener('change', (event) => {
  systemDark.value = event.matches;
});

export const resolvedTheme = computed<ResolvedTheme>(() => {
  if (theme.value === 'system') {
    return systemDark.value ? 'dark' : 'light';
  }
  return theme.value;
});

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolvedTheme.value;
  }
});

function persist(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ weightUnit: weightUnit.value, weekStart: weekStart.value, theme: theme.value }),
    );
  } catch {
    return;
  }
}

export function applyPreferences(next: DisplayPreferences): void {
  weightUnit.value = next.weightUnit;
  weekStart.value = next.weekStart;
  persist();
}

export function applyTheme(next: ThemePreference): void {
  theme.value = next;
  persist();
}
