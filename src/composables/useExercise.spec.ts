import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '@/test/router-harness';

import { useExercise } from './useExercise';

afterEach(() => vi.unstubAllGlobals());

function detail(page = 1, totalPages = 2) {
  return {
    exercise: { id: 'e1', name: 'Bench Press' },
    history: { data: [{ workoutId: `w${page}` }], meta: { page, limit: 10, total: 20, totalPages } },
  };
}

describe('useExercise', () => {
  it('fetches the exercise detail by slug', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(detail()));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();

    expect(resource.detail.value?.exercise.name).toBe('Bench Press');
    expect(resource.hasMoreHistory.value).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/exercises/bench-press');
    scope.stop();
  });

  it('flags notFound on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({ message: 'no such exercise' }, 404)));

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'missing'))!;
    await flushPromises();

    expect(resource.notFound.value).toBe(true);
    expect(resource.detail.value).toBeNull();
    scope.stop();
  });

  it('loads more history and appends it, tracking the new page', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = String(url).includes('page=2') ? 2 : 1;
      return jsonResponse(detail(page, 2));
    });
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();
    expect(resource.hasMoreHistory.value).toBe(true);

    await resource.loadMoreHistory();
    expect(resource.detail.value?.history.data).toHaveLength(2);
    expect(resource.hasMoreHistory.value).toBe(false);
    scope.stop();
  });

  it('does not load more history when there is none', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(detail(1, 1)));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();

    await resource.loadMoreHistory();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    scope.stop();
  });

  it('updates the classification and refreshes the detail', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({});
      return jsonResponse(detail());
    });
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();

    const ok = await resource.updateClassification({ muscleGroup: 'CHEST' });
    expect(ok).toBe(true);
    expect(resource.isSaving.value).toBe(false);
    scope.stop();
  });

  it('surfaces a mutation error when updating fails', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({ message: 'cannot update' }, 400);
      return jsonResponse(detail());
    });
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();

    const ok = await resource.updateClassification({ muscleGroup: 'CHEST' });
    expect(ok).toBe(false);
    expect(resource.mutationError.value).toBe('cannot update');
    scope.stop();
  });

  it('merges into another exercise and refreshes', async () => {
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
      if (String(url).endsWith('/merge')) {
        return jsonResponse({ targetExerciseId: 'e1', targetName: 'Bench Press', workoutExercisesRepointed: 3, aliasesAdded: [] });
      }
      return jsonResponse(detail());
    });
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();

    const merged = await resource.mergeInto('other-id');
    expect(merged?.workoutExercisesRepointed).toBe(3);
    scope.stop();
  });

  it('returns null from mutations when there is no detail loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({ message: 'no' }, 404)));

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'missing'))!;
    await flushPromises();

    expect(await resource.updateClassification({})).toBe(false);
    expect(await resource.mergeInto('x')).toBeNull();
    scope.stop();
  });

  it('re-fetches when refresh is called', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse(detail()));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useExercise(() => 'bench-press'))!;
    await flushPromises();
    resource.refresh();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    scope.stop();
  });
});
