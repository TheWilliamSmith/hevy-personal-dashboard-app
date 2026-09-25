import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '@/test/router-harness';

import { useMuscleHeatmap } from './useMuscleHeatmap';

afterEach(() => vi.unstubAllGlobals());

describe('useMuscleHeatmap', () => {
  it('requests the muscle heatmap with the given params', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({ metric: 'sets' }));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() =>
      useMuscleHeatmap(() => ({ from: '2026-01-01', to: '2026-02-01' }), () => 'sets', () => true),
    )!;
    await flushPromises();

    expect(resource.data.value).toEqual({ metric: 'sets' });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/stats/muscle-heatmap');
    expect(url).toContain('metric=sets');
    expect(url).toContain('includeSecondary=true');
    scope.stop();
  });
});
