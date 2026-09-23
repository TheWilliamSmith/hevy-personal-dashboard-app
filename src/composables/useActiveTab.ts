import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type TabName =
  | 'dashboard'
  | 'body'
  | 'progress'
  | 'trophies'
  | 'workouts'
  | 'exercises'
  | 'imports';

export const TABS: ReadonlyArray<{ name: TabName; label: string }> = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'body', label: 'Body' },
  { name: 'progress', label: 'Progress' },
  { name: 'trophies', label: 'Trophies' },
  { name: 'workouts', label: 'Workouts' },
  { name: 'exercises', label: 'Exercises' },
  { name: 'imports', label: 'Imports' },
];

export const FULL_WIDTH_TABS: ReadonlySet<TabName> = new Set<TabName>([
  'dashboard',
  'body',
  'progress',
  'trophies',
  'workouts',
  'exercises',
]);

function isTab(value: unknown): value is TabName {
  return (
    value === 'dashboard' ||
    value === 'body' ||
    value === 'progress' ||
    value === 'trophies' ||
    value === 'workouts' ||
    value === 'exercises' ||
    value === 'imports'
  );
}

export interface UseActiveTab {
  tab: ComputedRef<TabName>;
  isFullWidth: ComputedRef<boolean>;
  setTab: (tab: TabName) => void;
}

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
