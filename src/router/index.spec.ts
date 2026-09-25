// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { router } from './index';

describe('the app router', () => {
  it('registers the single home route plus a catch-all redirect', () => {
    expect(router.resolve('/').name).toBe('home');
    expect(router.resolve('/anything/else').matched[0]?.redirect).toEqual({ name: 'home' });
  });

  it('scrolls to top when the tab, workout or exercise query changes', () => {
    const behavior = router.options.scrollBehavior;
    expect(behavior).toBeTypeOf('function');
    if (!behavior) return;

    const from = { query: { tab: 'dashboard' } } as never;
    const changed = { query: { tab: 'workouts' } } as never;
    const same = { query: { tab: 'dashboard' } } as never;

    expect(behavior(changed, from, null)).toEqual({ top: 0 });
    expect(behavior(same, from, null)).toBe(false);
  });

  it('restores the saved scroll position when one is available', () => {
    const behavior = router.options.scrollBehavior;
    if (!behavior) return;

    const from = { query: {} } as never;
    const to = { query: {} } as never;
    const saved = { left: 0, top: 240 };

    expect(behavior(to, from, saved)).toBe(saved);
  });
});
