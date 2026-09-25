import { afterEach, describe, expect, it, vi } from 'vitest';

import { invalidateWorkoutData } from '@/lib/data-version';

import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiUrl, extractApiMessage } from './api';

afterEach(() => vi.unstubAllGlobals());

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiUrl', () => {
  it('joins the base url and the path', () => {
    expect(apiUrl('/workouts')).toBe('/api/workouts');
  });
});

describe('extractApiMessage', () => {
  it('returns null for an empty body', () => {
    expect(extractApiMessage('')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(extractApiMessage('not json')).toBeNull();
  });

  it('reads a string message', () => {
    expect(extractApiMessage(JSON.stringify({ message: 'nope' }))).toBe('nope');
  });

  it('joins an array of messages', () => {
    expect(extractApiMessage(JSON.stringify({ message: ['a', 'b'] }))).toBe('a b');
  });

  it('falls back to the error field', () => {
    expect(extractApiMessage(JSON.stringify({ error: 'Bad Request' }))).toBe('Bad Request');
  });

  it('returns null when nothing usable is present', () => {
    expect(extractApiMessage(JSON.stringify({ statusCode: 500 }))).toBeNull();
  });

  it('returns null for an empty message array', () => {
    expect(extractApiMessage(JSON.stringify({ message: [] }))).toBeNull();
  });
});

describe('ApiError', () => {
  it('carries a status and a message', () => {
    const error = new ApiError('oops', 404);
    expect(error.message).toBe('oops');
    expect(error.status).toBe(404);
    expect(error.name).toBe('ApiError');
  });
});

describe('apiGet', () => {
  it('resolves with the parsed body on success', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({ ok: true })));
    await expect(apiGet('/workouts')).resolves.toEqual({ ok: true });
  });

  it('builds a query string, skipping undefined and empty values', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
    await apiGet('/workouts', { page: 2, search: '', exercise: undefined, limit: 20 });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/workouts?page=2&limit=20');
  });

  it('omits the query string when there are no params', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
    await apiGet('/workouts');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/workouts');
  });

  it('maps a 404 to its message', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({ message: 'Workout not found' }, 404)));
    await expect(apiGet('/workouts/x')).rejects.toMatchObject({ status: 404, message: 'Workout not found' });
  });

  it('gives a 404 a default message when the body has none', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => new Response('', { status: 404 })));
    await expect(apiGet('/workouts/x')).rejects.toMatchObject({ message: 'Not found.' });
  });

  it.each([409, 410])('maps status %i to a default "no longer possible" message', async (status) => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => new Response('', { status })));
    await expect(apiGet('/workouts/x')).rejects.toMatchObject({ message: 'This action is no longer possible.' });
  });

  it('maps a 5xx to a generic server message', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => new Response('', { status: 503 })));
    await expect(apiGet('/workouts')).rejects.toMatchObject({
      message: 'The server failed to answer. Try again in a moment.',
    });
  });

  it('falls back to an HTTP status message for other errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => new Response('', { status: 418 })));
    await expect(apiGet('/workouts')).rejects.toMatchObject({ message: 'Request failed (HTTP 418).' });
  });

  it('wraps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new TypeError('network down'); }));
    await expect(apiGet('/workouts')).rejects.toMatchObject({
      message: 'Could not reach the server. Check your connection.',
      status: null,
    });
  });

  it('rethrows an abort without wrapping it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new DOMException('aborted', 'AbortError'); }));
    await expect(apiGet('/workouts')).rejects.toBeInstanceOf(DOMException);
  });

  it('bypasses the HTTP cache once data has been invalidated', async () => {
    invalidateWorkoutData();
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
    await apiGet('/workouts');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: 'reload' });
  });
});

describe('apiPost', () => {
  it('sends a JSON body and resolves with the response', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({ id: '1' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiPost('/imports/hevy/confirm', { stagedImportId: 'abc' })).resolves.toEqual({ id: '1' });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('rejects with an ApiError on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({ message: 'bad' }, 400)));
    await expect(apiPost('/x', {})).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new TypeError('down'); }));
    await expect(apiPost('/x', {})).rejects.toMatchObject({ status: null });
  });

  it('rethrows an abort without wrapping it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new DOMException('aborted', 'AbortError'); }));
    await expect(apiPost('/x', {})).rejects.toBeInstanceOf(DOMException);
  });
});

describe('apiDelete', () => {
  it('sends a DELETE request with query params', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await apiDelete('/imports/1', { deleteWorkouts: 'true' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/imports/1?deleteWorkouts=true');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });

  it('rejects with an ApiError on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({}, 500)));
    await expect(apiDelete('/imports/1')).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new TypeError('down'); }));
    await expect(apiDelete('/imports/1')).rejects.toMatchObject({ status: null });
  });

  it('rethrows an abort without wrapping it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new DOMException('aborted', 'AbortError'); }));
    await expect(apiDelete('/imports/1')).rejects.toBeInstanceOf(DOMException);
  });
});

describe('apiPatch', () => {
  it('sends a JSON PATCH body', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await apiPatch('/exercises/1', { muscleGroup: 'BACK' });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PATCH' });
  });

  it('rejects with an ApiError on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => jsonResponse({}, 422)));
    await expect(apiPatch('/exercises/1', {})).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new TypeError('down'); }));
    await expect(apiPatch('/exercises/1', {})).rejects.toMatchObject({ status: null });
  });

  it('rethrows an abort without wrapping it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (..._args: unknown[]) => { throw new DOMException('aborted', 'AbortError'); }));
    await expect(apiPatch('/exercises/1', {})).rejects.toBeInstanceOf(DOMException);
  });
});
