import { afterEach, describe, expect, it, vi } from 'vitest';

import { secureRandom } from './random';

describe('secureRandom', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns values in [0, 1)', () => {
    for (let i = 0; i < 1000; i++) {
      const value = secureRandom();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('draws from crypto.getRandomValues', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    secureRandom();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('maps the full uint32 range', () => {
    const fill = (value: number) =>
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
        (array as unknown as Uint32Array)[0] = value;
        return array;
      });
    fill(0);
    expect(secureRandom()).toBe(0);
    vi.restoreAllMocks();
    fill(0xffff_ffff);
    expect(secureRandom()).toBeLessThan(1);
  });
});
