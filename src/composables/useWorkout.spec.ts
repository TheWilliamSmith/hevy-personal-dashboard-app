import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '@/test/router-harness';

import { useWorkout } from './useWorkout';

afterEach(() => vi.unstubAllGlobals());

const detail = { id: 'w1', title: 'Push day' };

describe('useWorkout', () => {
  it('fetches the workout detail for the given id', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(detail));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useWorkout(() => 'w1'))!;
    await flushPromises();

    expect(resource.workout.value).toEqual(detail);
    expect(resource.isLoading.value).toBe(false);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/workouts/w1');
    scope.stop();
  });

  it('does nothing when the id is empty', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(detail));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useWorkout(() => ''))!;
    await flushPromises();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(resource.workout.value).toBeNull();
    scope.stop();
  });

  it('flags notFound on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({ message: 'nope' }, 404)));

    const scope = effectScope();
    const resource = scope.run(() => useWorkout(() => 'missing'))!;
    await flushPromises();

    expect(resource.notFound.value).toBe(true);
    expect(resource.workout.value).toBeNull();
    expect(resource.error.value).toBe('nope');
    scope.stop();
  });

  it('flags notFound on a 400 too', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({}, 400)));

    const scope = effectScope();
    const resource = scope.run(() => useWorkout(() => 'bad-id'))!;
    await flushPromises();

    expect(resource.notFound.value).toBe(true);
    scope.stop();
  });

  it('does not flag notFound on a server error', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({}, 500)));

    const scope = effectScope();
    const resource = scope.run(() => useWorkout(() => 'w1'))!;
    await flushPromises();

    expect(resource.notFound.value).toBe(false);
    scope.stop();
  });

  it('re-fetches when retry is called', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(detail));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useWorkout(() => 'w1'))!;
    await flushPromises();
    resource.retry();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    scope.stop();
  });
});
