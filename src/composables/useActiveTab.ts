import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type TabName = 'dashboard' | 'workouts' | 'imports';

export const TABS: ReadonlyArray<{ name: TabName; label: string }> = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'workouts', label: 'Workouts' },
  { name: 'imports', label: 'Imports' },
];

/** The dashboard grid wants the whole viewport; the other tabs do not. */
export const FULL_WIDTH_TABS: ReadonlySet<TabName> = new Set<TabName>(['dashboard']);

function isTab(value: unknown): value is TabName {
  return value === 'dashboard' || value === 'workouts' || value === 'imports';
}

export interface UseActiveTab {
  tab: ComputedRef<TabName>;
  isFullWidth: ComputedRef<boolean>;
  setTab: (tab: TabName) => void;
}

/**
 * There is one route. The visible tab and every filter live in the query
 * string, so the URL always describes the whole view.
 *
 * Switching tabs drops the previous tab's parameters instead of merging them:
 * `from`/`to` mean a date window on both the dashboard and the workouts list,
 * and carrying one tab's window into the other silently re-filters a view the
 * user never touched.
 */
export function useActiveTab(): UseActiveTab {
  const route = useRoute();
  const router = useRouter();

  const tab = computed<TabName>(() => (isTab(route.query.tab) ? route.query.tab : 'dashboard'));

  return {
    tab,
    isFullWidth: computed(() => FULL_WIDTH_TABS.has(tab.value)),
    setTab: (next) => {
      if (next === tab.value) {
        return;
      }
      void router.push({ name: 'home', query: next === 'dashboard' ? {} : { tab: next } });
    },
  };
}
