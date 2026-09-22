<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();

/**
 * Routes opt into full-bleed via `meta.fullWidth`. The shell owns the
 * container so views carry content only — previously every view repeated
 * `mx-auto w-full max-w-4xl p-6`.
 */
const isFullWidth = computed(() => route.meta.fullWidth === true);
const container = computed(() => (isFullWidth.value ? 'w-full' : 'mx-auto w-full max-w-4xl'));

const link =
  'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900';
const activeLink = 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700';
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="border-b border-slate-200 bg-white">
      <nav :class="[container, 'flex items-center gap-2 px-6 py-4']" aria-label="Main">
        <span class="mr-auto font-semibold text-slate-900">Hevy Personal Dashboard</span>
        <RouterLink :to="{ name: 'dashboard' }" :class="link" :active-class="activeLink">
          Dashboard
        </RouterLink>
        <RouterLink :to="{ name: 'workouts' }" :class="link" :active-class="activeLink">
          Workouts
        </RouterLink>
        <RouterLink :to="{ name: 'import' }" :class="link" :active-class="activeLink">
          Imports
        </RouterLink>
      </nav>
    </header>

    <main :class="[container, isFullWidth ? 'py-4' : 'p-6']">
      <RouterView />
    </main>
  </div>
</template>
