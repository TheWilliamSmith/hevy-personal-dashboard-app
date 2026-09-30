<script setup lang="ts">
import {
  Activity,
  Database,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  PersonStanding,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, watch, type Component } from 'vue';
import { RouterLink } from 'vue-router';

import HevySyncCard from '@/components/layout/HevySyncCard.vue';
import { TABS, useActiveTab, type TabName } from '@/composables/useActiveTab';
import { useSidebar } from '@/composables/useSidebar';

const ICONS: Readonly<Record<TabName, Component>> = {
  dashboard: LayoutDashboard,
  body: PersonStanding,
  progress: TrendingUp,
  trophies: Trophy,
  workouts: Dumbbell,
  exercises: ListChecks,
  data: Database,
};

const FOOTER_TABS: ReadonlySet<TabName> = new Set<TabName>(['data']);

const { tab } = useActiveTab();
const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();

const mainItems = computed(() => TABS.filter((item) => !FOOTER_TABS.has(item.name)));
const footerItems = computed(() => TABS.filter((item) => FOOTER_TABS.has(item.name)));

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
    aria-label="Main navigation"
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
        <span class="truncate text-sm font-semibold text-white">Hevy Dashboard</span>
      </div>

      <button
        type="button"
        :class="[iconButton, 'hidden lg:inline-flex']"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="toggleCollapsed"
      >
        <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="h-4 w-4" />
      </button>
      <button type="button" :class="[iconButton, 'lg:hidden']" aria-label="Close menu" @click="closeMobile">
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
            <component :is="ICONS[item.name]" class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span :class="{ 'lg:sr-only': collapsed }">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <ul class="mt-auto space-y-0.5 pt-4">
        <li v-for="item in footerItems" :key="item.name">
          <RouterLink
            :to="linkTo(item.name)"
            :class="[itemBase, tab === item.name ? itemActive : itemIdle, { 'lg:justify-center': collapsed }]"
            :aria-current="tab === item.name ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="ICONS[item.name]" class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span :class="{ 'lg:sr-only': collapsed }">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="shrink-0 p-3" :class="{ 'lg:hidden': collapsed }">
      <HevySyncCard />
    </div>
  </aside>
</template>
