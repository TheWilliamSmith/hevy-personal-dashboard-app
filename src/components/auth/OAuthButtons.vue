<script setup lang="ts">
import type { OAuthProvider } from '@/composables/useAuth';

defineProps<{ pending: OAuthProvider | null; disabled: boolean; action: string }>();

const emit = defineEmits<{ select: [provider: OAuthProvider] }>();

const PROVIDERS: ReadonlyArray<{ id: OAuthProvider; label: string }> = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
];
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      v-for="provider in PROVIDERS"
      :key="provider.id"
      type="button"
      class="flex w-full items-center justify-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      :aria-busy="pending === provider.id"
      @click="emit('select', provider.id)"
    >
      <span
        v-if="pending === provider.id"
        class="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100"
        aria-hidden="true"
      />
      <svg v-else-if="provider.id === 'google'" viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.9 11.9 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
        <path
          d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5a11 11 0 0 0 1.4-2.9 4.5 4.5 0 0 1-2.6-4.1zM13.9 5.1c.7-.9 1.2-2 1.1-3.1-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.6z"
        />
      </svg>
      {{ action }} with {{ provider.label }}
    </button>
  </div>
</template>
