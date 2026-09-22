<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    isLoading?: boolean;
    error?: string | null;
    isEmpty?: boolean;
    emptyLabel?: string;
    /** Fixed so every card in a row lines up regardless of its content. */
    height?: number;
    /** Screen-reader summary of the series; see the a11y note below. */
    ariaLabel?: string;
  }>(),
  { height: 280, emptyLabel: 'No data for this period.' },
);

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <section class="flex flex-col rounded-xl border border-slate-200 bg-white">
    <header class="flex flex-wrap items-start gap-2 border-b border-slate-100 px-4 py-3">
      <div class="mr-auto">
        <h2 class="text-sm font-semibold text-slate-900">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="text-xs text-slate-500">{{ props.subtitle }}</p>
      </div>
      <!-- Metric switchers, sort toggles, year pickers land here. -->
      <slot name="toolbar" />
    </header>

    <div
      class="relative flex-1 p-3"
      :style="{ minHeight: `${props.height}px` }"
      :aria-busy="props.isLoading"
    >
      <div v-if="props.isLoading" class="h-full w-full animate-pulse rounded-lg bg-slate-100" />

      <div
        v-else-if="props.error"
        class="flex h-full flex-col items-center justify-center gap-3 text-center"
        role="alert"
      >
        <p class="text-sm text-red-800">{{ props.error }}</p>
        <button
          type="button"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
          @click="emit('retry')"
        >
          Retry
        </button>
      </div>

      <p
        v-else-if="props.isEmpty"
        class="flex h-full items-center justify-center text-sm text-slate-500"
      >
        {{ props.emptyLabel }}
      </p>

      <div v-else class="h-full" :style="{ height: `${props.height}px` }">
        <!--
          The chart itself is decorative to assistive tech; the accessible
          content is the aria-label summary plus the table in #fallback.
        -->
        <div class="h-full" role="img" :aria-label="props.ariaLabel ?? props.title">
          <slot />
        </div>
      </div>
    </div>

    <!-- Visually hidden data table fallback. -->
    <div v-if="!props.isLoading && !props.error && !props.isEmpty" class="sr-only">
      <slot name="fallback" />
    </div>
  </section>
</template>
