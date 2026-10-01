// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSyncRuns } from '@/composables/useSyncRuns';
import { syncRun } from '../../support/fake-api';
import { flushPromises, jsonResponse, stubFetch } from '../../support/mount';

afterEach(() => vi.unstubAllGlobals());

function page(number: number, totalPages = 3) {
  return { data: [syncRun({ id: `run${number}` })], meta: { page: number, limit: 20, total: 60, totalPages } };
}

describe('useSyncRuns', () => {
  it('loads the first page, then moves between pages within bounds', async () => {
    const fetchMock = stubFetch((url) => page(Number(new URL(url, 'http://x').searchParams.get('page'))));
    const runs = useSyncRuns();
    await flushPromises();

    expect(runs.runs.value.map((run) => run.id)).toEqual(['run1']);

    runs.goToPage(2);
    await flushPromises();
    expect(runs.runs.value.map((run) => run.id)).toEqual(['run2']);

    runs.goToPage(0);
    runs.goToPage(4);
    runs.goToPage(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    runs.refresh();
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('expands and collapses a row', () => {
    stubFetch(() => page(1));
    const runs = useSyncRuns();

    runs.toggleRow('run1');
    expect(runs.expandedId.value).toBe('run1');
    runs.toggleRow('run1');
    expect(runs.expandedId.value).toBeNull();
  });

  it('reports a load error', async () => {
    stubFetch(() => jsonResponse({ statusCode: 500, message: 'Down' }, 500));
    const runs = useSyncRuns();
    await flushPromises();

    expect(runs.error.value).not.toBeNull();
    expect(runs.runs.value).toEqual([]);
    expect(runs.isLoading.value).toBe(false);
  });
});
