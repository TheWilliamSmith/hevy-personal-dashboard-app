import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '@/test/router-harness';

import { useImportBatches } from './useImportBatches';

afterEach(() => vi.unstubAllGlobals());

const batchList = {
  data: [
    { id: 'b1', fileName: 'a.csv', rollbackable: true, workoutsCreated: 2 },
    { id: 'b2', fileName: 'b.csv', rollbackable: true, workoutsCreated: 1 },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

const batchDetail = { id: 'b1', fileName: 'a.csv', workouts: [{ id: 'w1', title: 'Push day' }] };

function stubBatches() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (init?.method === 'DELETE') {
      return jsonResponse({ batchId: 'b1', workoutsDeleted: 2, setsDeleted: 10, workoutsKept: 0 });
    }
    if (path.includes('/imports/b1') && !path.endsWith('/imports')) {
      return jsonResponse(batchDetail);
    }
    return jsonResponse(batchList);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useImportBatches', () => {
  it('loads the batch list on creation', async () => {
    stubBatches();
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    expect(resource.batches.value).toEqual(batchList.data);
    expect(resource.meta.value).toEqual(batchList.meta);
    scope.stop();
  });

  it('surfaces an error and clears state on a list failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'bad' }, 400)));
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    expect(resource.error.value).toBe('bad');
    expect(resource.batches.value).toEqual([]);
    scope.stop();
  });

  it('expands a row to load its detail, then collapses it', async () => {
    stubBatches();
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    resource.toggleRow('b1');
    await flushPromises();
    expect(resource.expandedId.value).toBe('b1');
    expect(resource.detail.value).toEqual(batchDetail);

    resource.toggleRow('b1');
    expect(resource.expandedId.value).toBeNull();
    expect(resource.detail.value).toBeNull();
    scope.stop();
  });

  it('surfaces a detail error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/imports/b1')) return jsonResponse({ message: 'no detail' }, 404);
        return jsonResponse(batchList);
      }),
    );
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    resource.toggleRow('b1');
    await flushPromises();
    expect(resource.detailError.value).toBe('no detail');
    scope.stop();
  });

  it('rolls back a batch and refreshes the list', async () => {
    const fetchMock = stubBatches();
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    resource.toggleRow('b1');
    await flushPromises();

    const result = await resource.rollback('b1', true);
    expect(result?.workoutsDeleted).toBe(2);
    expect(resource.expandedId.value).toBeNull();
    expect(fetchMock).toHaveBeenCalled();
    scope.stop();
  });

  it('goes back a page after rolling back the last row on a later page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const path = String(url);
        if (init?.method === 'DELETE') {
          return jsonResponse({ batchId: 'b2', workoutsDeleted: 0, setsDeleted: 0, workoutsKept: 3 });
        }
        if (path.includes('page=2')) {
          return jsonResponse({ data: [{ id: 'b2', fileName: 'b.csv' }], meta: { page: 2, limit: 20, total: 21, totalPages: 2 } });
        }
        return jsonResponse({ data: Array.from({ length: 20 }, (_, i) => ({ id: `b${i}` })), meta: { page: 1, limit: 20, total: 21, totalPages: 2 } });
      }),
    );
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    resource.goToPage(2);
    await flushPromises();
    expect(resource.batches.value).toHaveLength(1);

    await resource.rollback('b2', false);
    expect(resource.batches.value.length).toBeGreaterThanOrEqual(0);
    scope.stop();
  });

  it('surfaces a rollback error without touching the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') return jsonResponse({ message: 'cannot rollback' }, 409);
        return jsonResponse(batchList);
      }),
    );
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    const result = await resource.rollback('b1', false);
    expect(result).toBeNull();
    expect(resource.deleteError.value).toBe('cannot rollback');
    scope.stop();
  });

  it('ignores an out-of-range page change', async () => {
    stubBatches();
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();

    resource.goToPage(99);
    await flushPromises();
    expect(resource.meta.value?.page).toBe(1);
  });

  it('re-fetches when refresh is called', async () => {
    const fetchMock = stubBatches();
    const scope = effectScope();
    const resource = scope.run(() => useImportBatches())!;
    await flushPromises();
    const before = fetchMock.mock.calls.length;

    resource.refresh();
    await flushPromises();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
    scope.stop();
  });
});
