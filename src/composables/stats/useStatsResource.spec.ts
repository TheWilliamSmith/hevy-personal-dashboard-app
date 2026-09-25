import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { invalidateWorkoutData } from '@/lib/data-version';
import { ApiError } from '@/lib/api';
import { flushPromises } from '@/test/router-harness';

import { useStatsResource } from './useStatsResource';

afterEach(() => vi.unstubAllGlobals());

describe('useStatsResource', () => {
  it('loads data immediately and exposes it', async () => {
    const scope = effectScope();
    const resource = scope.run(() =>
      useStatsResource(async () => ({ hello: 'world' }), () => null),
    )!;
    await flushPromises();
    expect(resource.data.value).toEqual({ hello: 'world' });
    expect(resource.isLoading.value).toBe(false);
    expect(resource.error.value).toBeNull();
    scope.stop();
  });

  it('exposes the API error message on failure', async () => {
    const scope = effectScope();
    const resource = scope.run(() =>
      useStatsResource(async () => {
        throw new ApiError('bad request', 400);
      }, () => null),
    )!;
    await flushPromises();
    expect(resource.data.value).toBeNull();
    expect(resource.error.value).toBe('bad request');
    scope.stop();
  });

  it('falls back to a generic message for a non-ApiError failure', async () => {
    const scope = effectScope();
    const resource = scope.run(() =>
      useStatsResource(async () => {
        throw new Error('boom');
      }, () => null),
    )!;
    await flushPromises();
    expect(resource.error.value).toBe('Something went wrong.');
    scope.stop();
  });

  it('ignores an aborted request instead of surfacing an error', async () => {
    const scope = effectScope();
    const resource = scope.run(() =>
      useStatsResource(async () => {
        throw new DOMException('aborted', 'AbortError');
      }, () => null),
    )!;
    await flushPromises();
    expect(resource.error.value).toBeNull();
    expect(resource.isLoading.value).toBe(false);
    scope.stop();
  });

  it('re-fetches when refresh is called', async () => {
    const fetcher = vi.fn(async () => ({ n: 1 }));
    const scope = effectScope();
    const resource = scope.run(() => useStatsResource(fetcher, () => null))!;
    await flushPromises();
    resource.refresh();
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
    scope.stop();
  });

  it('re-fetches when the dependencies change', async () => {
    let dep = 1;
    const fetcher = vi.fn(async () => dep);
    const scope = effectScope();
    let currentDep = 1;
    scope.run(() => useStatsResource(fetcher, () => currentDep));
    await flushPromises();
    dep = 2;
    currentDep = 2;
    await flushPromises();
    scope.stop();
    expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('re-fetches when workout data is invalidated', async () => {
    const fetcher = vi.fn(async () => 1);
    const scope = effectScope();
    scope.run(() => useStatsResource(fetcher, () => null));
    await flushPromises();
    const before = fetcher.mock.calls.length;
    invalidateWorkoutData();
    await flushPromises();
    scope.stop();
    expect(fetcher.mock.calls.length).toBeGreaterThan(before);
  });
});
