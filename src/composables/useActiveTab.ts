import { t } from '@/i18n';
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
  | 'friends'
  | 'settings';

export const TABS: ReadonlyArray<{ name: TabName; label: string }> = [
  {
    name: 'dashboard',
    get label() {
      return t('nav.dashboard');
    },
  },
  {
    name: 'body',
    get label() {
      return t('nav.body');
    },
  },
  {
    name: 'progress',
    get label() {
      return t('nav.progress');
    },
  },
  {
    name: 'goals',
    get label() {
      return t('nav.goals');
    },
  },
  {
    name: 'trophies',
    get label() {
      return t('nav.trophies');
    },
  },
  {
    name: 'workouts',
    get label() {
      return t('nav.workouts');
    },
  },
  {
    name: 'exercises',
    get label() {
      return t('nav.exercises');
    },
  },
  {
    name: 'friends',
    get label() {
      return t('nav.friends');
    },
  },
  {
    name: 'settings',
    get label() {
      return t('nav.settings');
    },
  },
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
    value === 'friends' ||
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
