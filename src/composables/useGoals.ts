import { t } from '@/i18n';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Goal, GoalChanges, GoalInput } from '@/types/goals';
import { sortGoals } from '@/utils/goals';

export interface UseGoals {
  goals: Ref<Goal[]>;
  active: ComputedRef<Goal[]>;
  archived: ComputedRef<Goal[]>;
  isLoading: Ref<boolean>;
  hasLoaded: Ref<boolean>;
  error: Ref<string | null>;
  load: () => Promise<void>;
  create: (input: GoalInput) => Promise<Goal>;
  update: (id: string, changes: GoalChanges) => Promise<Goal>;
  remove: (id: string) => Promise<void>;
}

export function useGoals(options: { includeArchived?: boolean } = {}): UseGoals {
  const goals = ref<Goal[]>([]);
  const isLoading = ref(false);
  const hasLoaded = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      goals.value = await apiGet<Goal[]>('/goals', options.includeArchived ? { archived: 'true' } : {});
      hasLoaded.value = true;
    } catch (error_) {
      error.value = error_ instanceof ApiError ? error_.message : t('errors.loadGoals');
    } finally {
      isLoading.value = false;
    }
  }

  function replace(goal: Goal): void {
    const visible = options.includeArchived || goal.archivedAt === null;
    const others = goals.value.filter((item) => item.id !== goal.id);
    goals.value = visible ? [goal, ...others] : others;
  }

  void load();

  return {
    goals,
    active: computed(() => sortGoals(goals.value.filter((goal) => goal.archivedAt === null))),
    archived: computed(() => goals.value.filter((goal) => goal.archivedAt !== null)),
    isLoading,
    hasLoaded,
    error,
    load,
    create: async (input) => {
      const goal = await apiPost<Goal>('/goals', input);
      replace(goal);
      return goal;
    },
    update: async (id, changes) => {
      const goal = await apiPatch<Goal>(`/goals/${id}`, changes);
      replace(goal);
      return goal;
    },
    remove: async (id) => {
      await apiDelete<{ id: string }>(`/goals/${id}`);
      goals.value = goals.value.filter((goal) => goal.id !== id);
    },
  };
}
