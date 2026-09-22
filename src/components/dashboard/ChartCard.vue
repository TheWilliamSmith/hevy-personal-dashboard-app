<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    isLoading?: boolean;
    error?: string | null;
    isEmpty?: boolean;
    emptyLabel?: string;
    /**
     * Desktop height of the plotting area. It is a MIN height, not a fixed one:
     * the card stretches to fill its grid row, which is what keeps neighbouring
     * cards flush instead of leaving a gap under the shorter one. Capped
     * against the viewport so a tall card still fits a phone screen.
     */
    height?: number;
    /** Screen-reader summary of the series. */
    ariaLabel?: string;
  }>(),
  { height: 280, emptyLabel: 'No data for this period.' },
);

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <section class="flex h-full min-w-0 flex-col bg-white">
    <header class="flex flex-wrap items-start gap-2 border-b border-slate-100 px-4 py-3">
      <div class="mr-auto min-w-0">
        <h2 class="truncate text-sm font-semibold text-slate-900">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="truncate text-xs text-slate-500">{{ props.subtitle }}</p>
      </div>
      <slot name="toolbar" />
    </header>

    <!-- flex-1 makes the body absorb whatever height the grid row hands down. -->
    <div
      class="relative flex min-h-0 flex-1 flex-col p-3"
      :style="{ minHeight: `min(${props.height}px, 60vh)` }"
      :aria-busy="props.isLoading"
    >
      <div v-if="props.isLoading" class="h-full w-full flex-1 animate-pulse rounded-lg bg-slate-100" />

      <div
        v-else-if="props.error"
        class="flex flex-1 flex-col items-center justify-center gap-3 text-center"
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

      <p v-else-if="props.isEmpty" class="flex flex-1 items-center justify-center text-sm text-slate-500">
        {{ props.emptyLabel }}
      </p>

      <!--
        The chart is decorative to assistive tech; the accessible content is the
        aria-label summary plus the table in #fallback.
      -->
      <!--
        The min-height is repeated here on purpose. flex-1 alone only resolves
        when an ancestor has a definite height, which a dashboard grid cell
        provides but a plain auto-height parent does not — there the chart
        collapsed to 0px and ECharts rendered an empty canvas.
      -->
      <div
        v-else
        class="relative min-h-0 flex-1"
        :style="{ minHeight: `min(${props.height}px, 60vh)` }"
        role="img"
        :aria-label="props.ariaLabel ?? props.title"
      >
        <slot />
      </div>
    </div>

    <div v-if="!props.isLoading && !props.error && !props.isEmpty" class="sr-only">
      <slot name="fallback" />
    </div>
  </section>
</template>
