<script setup lang="ts">
/**
 * A masked secret. It deliberately takes NO props: the API still sends the
 * masked item's rarity and XP, and a component that is never handed them
 * cannot leak them — not through a later edit, not through a tooltip.
 */
</script>

<template>
  <article
    class="trophy-tile flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center"
  >
    <span class="sr-only">Hidden achievement, locked</span>
    <span
      class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-500"
      aria-hidden="true"
    >
      ?
    </span>
    <p class="text-sm font-medium text-slate-500" aria-hidden="true">Hidden achievement</p>
  </article>
</template>
