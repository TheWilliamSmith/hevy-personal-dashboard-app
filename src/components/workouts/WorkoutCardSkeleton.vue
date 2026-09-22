<script setup lang="ts">
defineProps<{ count?: number }>();
</script>

<template>
  <li v-for="index in count ?? 5" :key="index" class="rounded-xl border border-slate-200 bg-white p-4">
    <div class="flex justify-between gap-4">
      <div class="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div class="h-5 w-48 animate-pulse rounded bg-slate-100" />
    </div>
    <div class="mt-4 flex gap-6">
      <div v-for="bar in 4" :key="bar" class="h-4 w-20 animate-pulse rounded bg-slate-100" />
    </div>
    <div class="mt-3 flex gap-1.5">
      <div v-for="chip in 3" :key="chip" class="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
    </div>
  </li>
</template>
