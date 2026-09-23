import { describe, expect, it } from 'vitest';

import { MAX_FILE_BYTES } from './useHevyImport';

describe('client-side upload limits', () => {
  it('matches the API MAX_CSV_BYTES of 10 MB', () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });
});
