// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { router } from './index';

describe('the app router', () => {
  it('registers the single home route plus a catch-all redirect', () => {
    expect(router.resolve('/').name).toBe('home');
    expect(router.resolve('/anything/else').matched[0]?.redirect).toEqual({ name: 'home' });
  });
});
