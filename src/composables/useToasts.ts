import { readonly, ref } from 'vue';

export type ToastTone = 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const DEFAULT_TTL_MS = 6000;

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToasts() {
  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function push(toast: Omit<Toast, 'id'>, ttlMs = DEFAULT_TTL_MS): number {
    const id = (nextId += 1);
    toasts.value = [...toasts.value, { ...toast, id }];

    if (toast.tone === 'success') {
      setTimeout(() => dismiss(id), ttlMs);
    }

    return id;
  }

  return { toasts: readonly(toasts), push, dismiss };
}
