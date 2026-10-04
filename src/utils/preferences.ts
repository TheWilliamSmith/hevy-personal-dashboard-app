import { ref } from 'vue';

import type { WeekStart, WeightUnit } from '@/types/profile';

const STORAGE_KEY = 'hevy-dashboard.preferences';

export interface DisplayPreferences {
  weightUnit: WeightUnit;
  weekStart: WeekStart;
}

const DEFAULTS: DisplayPreferences = { weightUnit: 'kg', weekStart: 'monday' };

function stored(): DisplayPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<DisplayPreferences> | null;
    return {
      weightUnit: parsed?.weightUnit === 'lb' ? 'lb' : 'kg',
      weekStart: parsed?.weekStart === 'sunday' ? 'sunday' : 'monday',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const initial = stored();

export const weightUnit = ref<WeightUnit>(initial.weightUnit);
export const weekStart = ref<WeekStart>(initial.weekStart);

export function applyPreferences(next: DisplayPreferences): void {
  weightUnit.value = next.weightUnit;
  weekStart.value = next.weekStart;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}
