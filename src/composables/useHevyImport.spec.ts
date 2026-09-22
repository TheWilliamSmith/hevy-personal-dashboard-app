import { describe, expect, it } from 'vitest';

import { MAX_FILE_BYTES } from './useHevyImport';

/**
 * The composable itself needs a DOM (XMLHttpRequest, File) to exercise end to
 * end, and the project has no DOM test environment. What is pinned here is the
 * client-side gate that must never drift from the API's own pipe.
 */
describe('client-side upload limits', () => {
  it('matches the API MAX_CSV_BYTES of 10 MB', () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });
});
