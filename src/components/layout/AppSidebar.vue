<script setup lang="ts">
import { t } from '@/i18n';
import {
  Activity,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  PersonStanding,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
} from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, watch, type Component } from 'vue';
import { RouterLink } from 'vue-router';

import HevySyncCard from '@/components/layout/HevySyncCard.vue';
import ProfileAvatar from '@/components/profile/ProfileAvatar.vue';
import { TABS, useActiveTab, type TabName } from '@/composables/useActiveTab';
import { useFriendRequests } from '@/composables/useFriendRequests';
import { useProfile } from '@/composables/useProfile';
import { useSidebar } from '@/composables/useSidebar';

const ICONS: Readonly<Record<TabName, Component>> = {
  dashboard: LayoutDashboard,
  body: PersonStanding,
  progress: TrendingUp,
  goals: Target,
  trophies: Trophy,
  workouts: Dumbbell,
  exercises: ListChecks,
  friends: Users,
  settings: Settings,
};

const { tab } = useActiveTab();
const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();
const { profile } = useProfile();
const { incoming } = useFriendRequests();

function badgeFor(name: TabName): number {
  return name === 'friends' ? incoming.value : 0;
}

const mainItems = computed(() => TABS.filter((item) => item.name !== 'settings'));

function linkTo(name: TabName) {
  return name === 'dashboard' ? { name: 'home' } : { name: 'home', query: { tab: name } };
}

watch(tab, closeMobile);

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMobile();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

const itemBase =
  'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const itemIdle = 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100';
const itemActive = 'bg-zinc-800 text-white';
const iconButton =
  'rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-30 bg-black/50 lg:hidden"
    aria-hidden="true"
    @click="closeMobile"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width,translate] duration-200 lg:static lg:h-full lg:translate-x-0"
    :class="[
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
      collapsed ? 'lg:w-16' : 'lg:w-60',
    ]"
    :aria-label="t('nav.mainNavigation')"
  >
    <div
      class="flex h-14 shrink-0 items-center gap-2 px-3"
      :class="collapsed ? 'lg:justify-center' : 'justify-between'"
    >
      <div class="flex min-w-0 items-center gap-2.5" :class="{ 'lg:hidden': collapsed }">
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-zinc-950"
        >
          <Activity class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
        </span>
        <span class="truncate text-sm font-semibold text-white">{{ t('common.appName') }}</span>
      </div>

      <button
        type="button"
        :class="[iconButton, 'hidden lg:inline-flex']"
        :aria-label="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        :aria-expanded="!collapsed"
        @click="toggleCollapsed"
      >
        <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="h-4 w-4" />
      </button>
      <button type="button" :class="[iconButton, 'lg:hidden']" :aria-label="t('nav.closeMenu')" @click="closeMobile">
        <X class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex flex-1 flex-col overflow-y-auto px-3 py-2">
      <ul class="space-y-0.5">
        <li v-for="item in mainItems" :key="item.name">
          <RouterLink
            :to="linkTo(item.name)"
            :class="[itemBase, tab === item.name ? itemActive : itemIdle, { 'lg:justify-center': collapsed }]"
            :aria-current="tab === item.name ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <span class="relative shrink-0">
              <component :is="ICONS[item.name]" class="h-4 w-4" aria-hidden="true" />
              <span
                v-if="badgeFor(item.name) > 0 && collapsed"
                class="absolute -top-1 -right-1 hidden h-2 w-2 rounded-full bg-blue-500 lg:block"
                aria-hidden="true"
              />
            </span>
            <span class="min-w-0 flex-1 truncate" :class="{ 'lg:sr-only': collapsed }">{{ item.label }}</span>
            <span
              v-if="badgeFor(item.name) > 0"
              class="rounded-full bg-blue-500 px-1.5 text-[11px] leading-[18px] font-semibold text-on-accent tabular-nums"
              :class="{ 'lg:hidden': collapsed }"
              aria-hidden="true"
            >
              {{ badgeFor(item.name) > 9 ? '9+' : badgeFor(item.name) }}
            </span>
            <span v-if="badgeFor(item.name) > 0" class="sr-only">
              {{ t('nav.friendRequests', { count: badgeFor(item.name) }, badgeFor(item.name)) }}
            </span>
          </RouterLink>
        </li>
      </ul>

    </nav>

    <div class="shrink-0 px-3 pb-2" :class="{ 'lg:hidden': collapsed }">
      <HevySyncCard />
    </div>

    <div class="shrink-0 border-t border-zinc-800 p-3">
      <RouterLink
        v-if="profile"
        :to="linkTo('settings')"
        class="flex items-center gap-3 rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :class="[tab === 'settings' ? 'bg-zinc-800' : 'hover:bg-zinc-900', { 'lg:justify-center': collapsed }]"
        :aria-current="tab === 'settings' ? 'page' : undefined"
        :title="collapsed ? t('nav.profileAndSettings') : undefined"
      >
        <ProfileAvatar :name="profile.displayName" :url="profile.avatarUrl" />
        <span class="min-w-0 flex-1" :class="{ 'lg:sr-only': collapsed }">
          <span class="block truncate text-sm font-medium text-zinc-100">{{ profile.displayName }}</span>
          <span class="block truncate text-[11px] text-zinc-500">@{{ profile.username }}</span>
        </span>
        <Settings class="h-4 w-4 shrink-0 text-zinc-500" :class="{ 'lg:hidden': collapsed }" aria-hidden="true" />
      </RouterLink>
    </div>
  </aside>
</template>
