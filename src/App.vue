<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';

const link =
  'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900';
const activeLink = 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700';
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="border-b border-slate-200 bg-white">
      <nav class="mx-auto flex w-full max-w-4xl items-center gap-2 p-4" aria-label="Main">
        <span class="mr-auto font-semibold text-slate-900">Hevy Personal Dashboard</span>
        <RouterLink :to="{ name: 'workouts' }" :class="link" :active-class="activeLink">
          Workouts
        </RouterLink>
        <RouterLink :to="{ name: 'import' }" :class="link" :active-class="activeLink">
          Import
        </RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
