<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  /** Used for the input id: names contain spaces and parentheses. */
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

/**
 * Muting asks for an optional reason in a small popover ("injury", "not a
 * priority"); unmuting is a single click — nothing to explain there.
 */
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
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      :aria-pressed="props.muted"
      :aria-expanded="props.muted ? undefined : open"
      :aria-label="`${props.muted ? 'Unmute' : 'Mute'} ${props.exerciseName}`"
      :disabled="props.busy"
      @click="onClick"
    >
      {{ props.muted ? 'Unmute' : 'Mute' }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-30 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
      role="dialog"
      :aria-label="`Mute ${props.exerciseName}`"
      @keydown.escape="open = false"
    >
      <label :for="`mute-reason-${props.exerciseId}`" class="text-xs font-medium text-slate-600">
        Reason (optional)
      </label>
      <input
        :id="`mute-reason-${props.exerciseId}`"
        ref="input"
        v-model="reason"
        type="text"
        maxlength="200"
        placeholder="Injury, off-season, not a priority…"
        class="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        @keydown.enter.prevent="confirm"
      />
      <p class="mt-2 text-xs text-slate-500">
        Muted exercises leave the counts and move to the Muted section.
      </p>
      <div class="mt-3 flex justify-end gap-2">
        <button type="button" class="text-xs font-medium text-slate-600" @click="open = false">
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white"
          @click="confirm"
        >
          Mute
        </button>
      </div>
    </div>
  </div>
</template>
