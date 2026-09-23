<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    isLoading?: boolean;
    error?: string | null;
    isEmpty?: boolean;
    emptyLabel?: string;
    height?: number;
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
