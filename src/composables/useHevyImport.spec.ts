import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeXMLHttpRequest } from '@/test/fake-xhr';

import { MAX_FILE_BYTES, useHevyImport } from './useHevyImport';

describe('client-side upload limits', () => {
  it('matches the API MAX_CSV_BYTES of 10 MB', () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });
});

function csvFile(name: string, size: number): File {
  const bytes = size > 0 ? new Uint8Array(size) : new Uint8Array(0);
  return new File([bytes], name, { type: 'text/csv' });
}

function currentXhr(): FakeXMLHttpRequest {
  const xhr = FakeXMLHttpRequest.instances.at(-1);
  if (!xhr) throw new Error('no XHR created');
  return xhr;
}

beforeEach(() => {
  FakeXMLHttpRequest.instances.length = 0;
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
});

afterEach(() => vi.unstubAllGlobals());

describe('selectFile validation', () => {
  it('rejects a non-csv file without uploading', () => {
    const { status, error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.txt', 100));
    expect(status.value).toBe('error');
    expect(error.value?.message).toContain('.csv');
    expect(FakeXMLHttpRequest.instances).toHaveLength(0);
  });

  it('rejects an empty file', () => {
    const { status, error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 0));
    expect(status.value).toBe('error');
    expect(error.value?.message).toBe('This file is empty.');
  });

  it('rejects a file over the size limit', () => {
    const { status, error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', MAX_FILE_BYTES + 1));
    expect(status.value).toBe('error');
    expect(error.value?.message).toContain('10 MB');
  });

  it('clears state when given no file', () => {
    const { status, file, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 0));
    selectFile(null);
    expect(status.value).toBe('idle');
    expect(file.value).toBeNull();
  });

  it('ignores a new selection while uploading', () => {
    const { status, file, selectFile } = useHevyImport();
    selectFile(csvFile('a.csv', 100));
    expect(status.value).toBe('uploading');
    selectFile(csvFile('b.csv', 100));
    expect(file.value?.name).toBe('a.csv');
  });
});

describe('upload flow', () => {
  it('tracks progress and moves to previewing on success', () => {
    const { status, progress, preview, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 1000));
    expect(status.value).toBe('uploading');

    const xhr = currentXhr();
    xhr.progress(500, 1000);
    expect(progress.value).toBe(50);

    xhr.respond(200, JSON.stringify({ stagedImportId: 's1', newWorkoutsPreview: [] }));
    expect(status.value).toBe('previewing');
    expect(progress.value).toBe(100);
    expect(preview.value?.stagedImportId).toBe('s1');
  });

  it('fails on a malformed success response', () => {
    const { status, error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(200, 'not json');
    expect(status.value).toBe('error');
    expect(error.value?.message).toBe('The server returned a malformed response.');
  });

  it('maps a 413 to the file-too-large message', () => {
    const { status, error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(413, '');
    expect(status.value).toBe('error');
    expect(error.value?.message).toContain('10 MB');
  });

  it('maps a 5xx to a generic server message', () => {
    const { error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(500, '');
    expect(error.value?.message).toBe('The server could not process this import. Try again in a moment.');
  });

  it('maps a 4xx body message when present', () => {
    const { error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(422, JSON.stringify({ message: 'Malformed CSV row 4.' }));
    expect(error.value?.message).toBe('Malformed CSV row 4.');
  });

  it('uses a default message for a 4xx with no body', () => {
    const { error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(400, '');
    expect(error.value?.message).toBe('The server rejected this file.');
  });

  it('falls back to a status message for other codes', () => {
    const { error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(302, '');
    expect(error.value?.message).toContain('302');
  });

  it('handles a network error', () => {
    const { status, error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().networkError();
    expect(status.value).toBe('error');
    expect(error.value?.message).toContain('connection');
  });

  it('handles a timeout', () => {
    const { error, selectFile } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    currentXhr().timeout();
    expect(error.value?.message).toContain('timed out');
  });

  it('cancels an in-flight upload and resets state', () => {
    const { status, file, selectFile, cancel } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    cancel();
    expect(status.value).toBe('idle');
    expect(file.value).toBeNull();
    expect(currentXhr().aborted).toBe(true);
  });
});

describe('confirm', () => {
  afterEach(() => vi.unstubAllGlobals());

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }

  function toPreviewing() {
    const flow = useHevyImport();
    flow.selectFile(csvFile('workouts.csv', 100));
    currentXhr().respond(200, JSON.stringify({ stagedImportId: 's1', newWorkoutsPreview: [] }));
    return flow;
  }

  it('does nothing when not in the previewing state', async () => {
    const { confirm } = useHevyImport();
    await expect(confirm()).resolves.toBeNull();
  });

  it('confirms the staged import and moves to success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ batchId: 'b1', workoutsCreated: 2 })));
    const flow = toPreviewing();

    const result = await flow.confirm();
    expect(result?.batchId).toBe('b1');
    expect(flow.status.value).toBe('success');
    expect(flow.result.value?.batchId).toBe('b1');
    expect(flow.preview.value).toBeNull();
  });

  it('surfaces a server error on confirm failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'expired' }, 410)));
    const flow = toPreviewing();

    const result = await flow.confirm();
    expect(result).toBeNull();
    expect(flow.status.value).toBe('error');
    expect(flow.error.value?.message).toBe('expired');
  });
});

describe('reset', () => {
  it('clears the result along with the rest of the state', () => {
    const { status, result, selectFile, reset } = useHevyImport();
    selectFile(csvFile('workouts.csv', 100));
    reset();
    expect(status.value).toBe('idle');
    expect(result.value).toBeNull();
  });
});
