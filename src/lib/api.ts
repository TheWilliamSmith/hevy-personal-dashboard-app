import { shouldBypassHttpCache } from './data-version';

export const API_URL: string = import.meta.env.VITE_API_URL;

export function apiUrl(path: string): string {
  return `${API_URL.replace(/\/$/, '')}${path}`;
}

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export function extractApiMessage(rawBody: string): string | null {
  if (!rawBody) {
    return null;
  }

  try {
    const body = JSON.parse(rawBody) as NestErrorBody;
    const message = body.message ?? body.error;

    if (Array.isArray(message)) {
      return message.join(' ') || null;
    }

    return typeof message === 'string' && message.length > 0 ? message : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type QueryParams = Record<string, string | number | undefined>;

function buildQuery(params: QueryParams): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function apiGet<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  const cache: RequestCache | undefined = shouldBypassHttpCache() ? 'reload' : undefined;

  try {
    response = await fetch(apiUrl(path) + buildQuery(params), { signal, cache });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Could not reach the server. Check your connection.', null);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(messageForStatus(response.status, extractApiMessage(body)), response.status);
  }

  return (await response.json()) as T;
}

function messageForStatus(status: number, apiMessage: string | null): string {
  if (status === 404) {
    return apiMessage ?? 'Not found.';
  }

  if (status === 409 || status === 410) {
    return apiMessage ?? 'This action is no longer possible.';
  }

  if (status >= 500) {
    return 'The server failed to answer. Try again in a moment.';
  }

  return apiMessage ?? `Request failed (HTTP ${status}).`;
}

async function readError(response: Response): Promise<ApiError> {
  const body = await response.text();
  return new ApiError(messageForStatus(response.status, extractApiMessage(body)), response.status);
}

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Could not reach the server. Check your connection.', null);
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as T;
}

export async function apiDelete<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path) + buildQuery(params), { method: 'DELETE', signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Could not reach the server. Check your connection.', null);
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as T;
}

export async function apiPatch<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Could not reach the server. Check your connection.', null);
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as T;
}
