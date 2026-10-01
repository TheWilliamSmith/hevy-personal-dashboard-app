import { t } from '@/i18n';
import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const TAB_NAMES = [
  'dashboard',
  'body',
  'progress',
  'goals',
  'trophies',
  'workouts',
  'exercises',
  'friends',
  'settings',
] as const;

export type TabName = (typeof TAB_NAMES)[number];

export const TABS: ReadonlyArray<{ name: TabName; label: string }> = TAB_NAMES.map((name) => ({
  name,
  get label() {
    return t(`nav.${name}`);
  },
}));

function isTab(value: unknown): value is TabName {
  return TAB_NAMES.includes(value as TabName);
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
