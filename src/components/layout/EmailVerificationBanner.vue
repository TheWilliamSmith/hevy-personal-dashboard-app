<script setup lang="ts">
import { MailWarning } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import { useAuth } from '@/composables/useAuth';
import { useToasts } from '@/composables/useToasts';
import { t } from '@/i18n';
import { ApiError } from '@/lib/api';

const auth = useAuth();
const { push } = useToasts();
const isSending = ref(false);

const visible = computed(() => auth.user.value !== null && !auth.user.value.emailVerified && !auth.user.value.pendingEmail);

async function resend(): Promise<void> {
  isSending.value = true;
  try {
    const sentTo = await auth.resendVerification();
    push({ tone: 'success', title: t('auth.verify.sent', { email: sentTo }) });
  } catch (error_) {
    push({ tone: 'error', title: t('auth.verify.sendFailed'), description: error_ instanceof ApiError ? error_.message : undefined });
  } finally {
    isSending.value = false;
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm sm:px-6"
  >
    <MailWarning class="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
    <p class="min-w-0 flex-1 text-zinc-200">{{ t('auth.verify.banner', { email: auth.user.value?.email ?? '' }) }}</p>
    <button
      type="button"
      class="rounded-md border border-amber-500/40 px-2.5 py-1 text-xs font-medium text-zinc-100 transition-colors hover:bg-amber-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:opacity-50"
      :disabled="isSending"
      @click="resend"
    >
      {{ t('auth.verify.resend') }}
    </button>
  </div>
</template>
