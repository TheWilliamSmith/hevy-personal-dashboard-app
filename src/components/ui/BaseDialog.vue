<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  labelledBy: string;
  /** Escape and backdrop clicks are ignored while a write is in flight. */
  locked?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
/** Focus goes back where it came from — usually the button that opened this. */
let previouslyFocused: HTMLElement | null = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusable(): HTMLElement[] {
  return panel.value ? Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

function requestClose(): void {
  if (!props.locked) {
    emit('close');
  }
}

/** Keeps Tab inside the dialog, which is what makes it modal in practice. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    requestClose();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const items = focusable();
  if (items.length === 0) {
    event.preventDefault();
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !panel.value?.contains(active))) {
    event.preventDefault();
    last?.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
}

function lockScroll(locked: boolean): void {
  document.body.style.overflow = locked ? 'hidden' : '';
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      lockScroll(true);
      await nextTick();
      // A dialog can mark its primary action with data-autofocus; otherwise the
      // first focusable element gets focus.
      const preferred = panel.value?.querySelector<HTMLElement>('[data-autofocus]');
      (preferred ?? focusable()[0] ?? panel.value)?.focus();
      return;
    }

    lockScroll(false);
    previouslyFocused?.focus();
    previouslyFocused = null;
  },
  { immediate: true },
);

// A dialog unmounted while open would otherwise leave the body unscrollable.
onBeforeUnmount(() => lockScroll(false));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6"
      @mousedown.self="requestClose"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="props.labelledBy"
        tabindex="-1"
        class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl"
        @keydown="onKeydown"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
