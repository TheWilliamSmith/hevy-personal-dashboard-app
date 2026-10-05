<script setup lang="ts">
import { t } from '@/i18n';
import { nextTick, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  exerciseId: string;
  exerciseName: string;
  muted: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{ mute: [reason: string | null]; unmute: [] }>();

const open = ref(false);
const reason = ref('');
const root = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);

async function onClick(): Promise<void> {
  if (props.muted) {
    emit('unmute');
    return;
  }
  open.value = !open.value;
  if (open.value) {
    reason.value = '';
    await nextTick();
    input.value?.focus();
  }
}

function confirm(): void {
  emit('mute', reason.value.trim() || null);
  open.value = false;
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) {
    open.value = false;
  }
}

document.addEventListener('mousedown', onDocumentClick);
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentClick));

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50"
      :class="focus"
      :aria-pressed="muted"
      :aria-expanded="muted ? undefined : open"
      :aria-label="t(muted ? 'progress.mute.unmuteName' : 'progress.mute.muteName', { name: exerciseName })"
      :disabled="busy"
      @click="onClick"
    >
      {{ muted ? t('progress.mute.unmute') : t('progress.mute.mute') }}
    </button>

    <dialog
      v-if="open"
      open
      class="absolute right-0 left-auto z-30 m-0 mt-1 w-64 max-w-none max-h-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 shadow-xl shadow-black/40"
      :aria-label="t('progress.mute.muteName', { name: exerciseName })"
      @keydown.escape="open = false"
    >
      <label :for="`mute-reason-${exerciseId}`" class="text-xs text-zinc-400">{{ t('progress.mute.reason') }}</label>
      <input
        :id="`mute-reason-${exerciseId}`"
        ref="input"
        v-model="reason"
        type="text"
        maxlength="200"
        :placeholder="t('progress.mute.placeholder')"
        class="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
        :class="focus"
        @keydown.enter.prevent="confirm"
      />
      <p class="mt-2 text-xs text-zinc-500">{{ t('progress.mute.explanation') }}</p>
      <div class="mt-3 flex justify-end gap-2">
        <button type="button" class="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-100" :class="focus" @click="open = false">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="rounded-md bg-white px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          @click="confirm"
        >
          {{ t('progress.mute.mute') }}
        </button>
      </div>
    </dialog>
  </div>
</template>
