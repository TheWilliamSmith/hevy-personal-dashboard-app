import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '@/test/router-harness';

import { useProgressSummary } from './useProgressSummary';

afterEach(() => vi.unstubAllGlobals());

describe('useProgressSummary', () => {
  it('fetches the progress summary', async () => {
    const summary = { counts: { REGRESSING: 1 }, topConcerns: [] };
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(summary));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useProgressSummary())!;
    await flushPromises();

    expect(resource.data.value).toEqual(summary);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/progress/summary');
    scope.stop();
  });
});
