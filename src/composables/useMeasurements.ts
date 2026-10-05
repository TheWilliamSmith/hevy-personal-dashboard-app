import { ref, type Ref } from 'vue';

import { t } from '@/i18n';
import { useProfile } from '@/composables/useProfile';
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Measurement, MeasurementInput } from '@/types/measurements';

export interface UseMeasurements {
  entries: Ref<Measurement[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  load: () => Promise<void>;
  create: (input: MeasurementInput) => Promise<Measurement>;
  update: (id: string, input: MeasurementInput) => Promise<Measurement>;
  remove: (id: string) => Promise<void>;
}

export function useMeasurements(): UseMeasurements {
  const entries = ref<Measurement[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const profile = useProfile();

  async function load(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      entries.value = await apiGet<Measurement[]>('/me/measurements');
    } catch (error_) {
      error.value = error_ instanceof ApiError ? error_.message : t('errors.generic');
    } finally {
      isLoading.value = false;
    }
  }

  async function changed<T>(work: Promise<T>): Promise<T> {
    const result = await work;
    await load();
    void profile.load();
    return result;
  }

  void load();

  return {
    entries,
    isLoading,
    error,
    load,
    create: (input) => changed(apiPost<Measurement>('/me/measurements', input)),
    update: (id, input) => changed(apiPatch<Measurement>(`/me/measurements/${id}`, input)),
    remove: (id) => changed(apiDelete(`/me/measurements/${id}`)).then(() => undefined),
  };
}
