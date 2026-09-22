<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-16 text-center">
    <h1 class="text-2xl font-semibold text-slate-900">Page not found</h1>
    <RouterLink
      :to="{ name: 'workouts' }"
      class="text-sm font-medium text-indigo-700 underline underline-offset-2"
    >
      Back to workouts
    </RouterLink>
  </div>
</template>
