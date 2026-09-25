import { describe, expect, it, vi } from 'vitest';

import { useToasts } from './useToasts';

describe('useToasts', () => {
  it('pushes a toast and assigns it an incrementing id', () => {
    const { toasts, push } = useToasts();
    const before = toasts.value.length;
    const id = push({ tone: 'error', title: 'Failed' });
    expect(toasts.value.length).toBe(before + 1);
    expect(toasts.value.at(-1)).toMatchObject({ id, tone: 'error', title: 'Failed' });
  });

  it('dismisses a toast by id', () => {
    const { toasts, push, dismiss } = useToasts();
    const id = push({ tone: 'warning', title: 'Careful' });
    dismiss(id);
    expect(toasts.value.find((toast) => toast.id === id)).toBeUndefined();
  });

  it('auto-dismisses a success toast after its ttl', () => {
    vi.useFakeTimers();
    const { toasts, push } = useToasts();
    const id = push({ tone: 'success', title: 'Saved' }, 100);
    expect(toasts.value.some((toast) => toast.id === id)).toBe(true);
    vi.advanceTimersByTime(100);
    expect(toasts.value.some((toast) => toast.id === id)).toBe(false);
    vi.useRealTimers();
  });

  it('does not auto-dismiss a warning or error toast', () => {
    vi.useFakeTimers();
    const { toasts, push } = useToasts();
    const id = push({ tone: 'error', title: 'Broken' }, 10);
    vi.advanceTimersByTime(1000);
    expect(toasts.value.some((toast) => toast.id === id)).toBe(true);
    vi.useRealTimers();
  });
});
