import { ref, watch, type Ref } from 'vue';

const STORAGE_KEY = 'sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

const collapsed = ref(readCollapsed());
const mobileOpen = ref(false);

watch(collapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    return;
  }
});

export interface UseSidebar {
  collapsed: Ref<boolean>;
  mobileOpen: Ref<boolean>;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export function useSidebar(): UseSidebar {
  return {
    collapsed,
    mobileOpen,
    toggleCollapsed: () => {
      collapsed.value = !collapsed.value;
    },
    openMobile: () => {
      mobileOpen.value = true;
    },
    closeMobile: () => {
      mobileOpen.value = false;
    },
  };
}
