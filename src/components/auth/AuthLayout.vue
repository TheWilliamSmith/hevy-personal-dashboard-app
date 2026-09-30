<script setup lang="ts">
import { Activity, CalendarDays, TrendingUp, Trophy } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';

defineProps<{ title: string; subtitle: string }>();

const FEATURES = [
  { icon: CalendarDays, text: 'Every session from Hevy, synced or imported, in one place.' },
  { icon: TrendingUp, text: 'Plateaus and regressions flagged before they cost you a season.' },
  { icon: Trophy, text: 'Trophies and levels for the work you already put in.' },
];
</script>

<template>
  <div class="grid h-dvh grid-cols-1 bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <div class="flex min-h-0 flex-col overflow-y-auto overscroll-contain px-6 py-6 sm:px-10">
      <RouterLink
        :to="{ name: 'home' }"
        class="flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        <span class="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-950">
          <Activity class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
        </span>
        <span class="text-sm font-semibold text-white">Hevy Dashboard</span>
      </RouterLink>

      <main class="flex flex-1 items-center justify-center py-10">
        <div class="flex w-full max-w-sm flex-col gap-8">
          <header>
            <h1 class="text-2xl font-semibold tracking-tight text-white">{{ title }}</h1>
            <p class="mt-1.5 text-sm text-zinc-400">{{ subtitle }}</p>
          </header>
          <slot />
        </div>
      </main>

      <p class="text-xs text-zinc-600">Not affiliated with Hevy. Your data stays yours.</p>
    </div>

    <aside
      class="relative hidden overflow-hidden border-l border-zinc-800 bg-gradient-to-br from-blue-950 via-zinc-950 to-zinc-950 lg:flex lg:flex-col lg:justify-end lg:p-12"
      aria-hidden="true"
    >
      <div class="absolute inset-0 grid grid-cols-[repeat(18,minmax(0,1fr))] content-start gap-1.5 p-12 opacity-40 [mask-image:linear-gradient(to_bottom,black_30%,transparent_65%)]">
        <span
          v-for="cell in 180"
          :key="cell"
          class="aspect-square rounded-[3px]"
          :class="(cell * 7) % 5 === 0 || (cell * 3) % 11 === 0 ? 'bg-blue-700' : 'bg-slate-800'"
        />
      </div>
      <div class="relative flex max-w-md flex-col gap-6">
        <p class="text-4xl font-semibold tracking-tight text-white">Your training, measured.</p>
        <ul class="flex flex-col gap-3">
          <li v-for="feature in FEATURES" :key="feature.text" class="flex items-start gap-3 text-sm text-zinc-300">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950/60">
              <component :is="feature.icon" class="h-4 w-4" />
            </span>
            <span class="pt-1">{{ feature.text }}</span>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>
