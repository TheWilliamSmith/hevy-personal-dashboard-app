import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type TabName =
  | 'dashboard'
  | 'body'
  | 'progress'
  | 'goals'
  | 'trophies'
  | 'workouts'
  | 'exercises'
  | 'settings';

export const TABS: ReadonlyArray<{ name: TabName; label: string }> = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'body', label: 'Body' },
  { name: 'progress', label: 'Progress' },
  { name: 'goals', label: 'Goals' },
  { name: 'trophies', label: 'Trophies' },
  { name: 'workouts', label: 'Workouts' },
  { name: 'exercises', label: 'Exercises' },
  { name: 'settings', label: 'Settings' },
];

function isTab(value: unknown): value is TabName {
  return (
    value === 'dashboard' ||
    value === 'body' ||
    value === 'progress' ||
    value === 'goals' ||
    value === 'trophies' ||
    value === 'workouts' ||
    value === 'exercises' ||
    value === 'settings'
  );
}

export interface UseActiveTab {
  tab: ComputedRef<TabName>;
  setTab: (tab: TabName) => void;
}

export function useActiveTab(): UseActiveTab {
  const route = useRoute();
  const router = useRouter();

  const tab = computed<TabName>(() => (isTab(route.query.tab) ? route.query.tab : 'dashboard'));

  return {
    tab,
    setTab: (next) => {
      if (next === tab.value) {
        return;
      }
      void router.push({ name: 'home', query: next === 'dashboard' ? {} : { tab: next } });
    },
  };
}
