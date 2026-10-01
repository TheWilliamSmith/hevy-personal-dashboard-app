import { accessToken } from './auth-session';
import { shouldBypassHttpCache } from './data-version';
import { reportUnauthorized } from './session-expiry';

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

function parseBody(rawBody: string): unknown {
  try {
    return rawBody ? (JSON.parse(rawBody) as unknown) : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function authHeaders(): Record<string, string> {
  const token = accessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

function messageForStatus(status: number, apiMessage: string | null): string {
  if (status === 404) {
    return apiMessage ?? 'Not found.';
  }

  if (status === 409 || status === 410) {
    return apiMessage ?? 'This action is no longer possible.';
  }

  if (status === 429) {
    return apiMessage ?? 'Too many attempts. Wait a moment and try again.';
  }

  if (status >= 500) {
    return 'The server failed to answer. Try again in a moment.';
  }

  return apiMessage ?? `Request failed (HTTP ${status}).`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  params?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = authHeaders();
  const headers: Record<string, string> = { ...auth };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path) + buildQuery(options.params ?? {}), {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: options.cache,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Could not reach the server. Check your connection.', null);
  }

  if (!response.ok) {
    reportUnauthorized(path, response.status, 'Authorization' in auth);
    const raw = await response.text();
    throw new ApiError(messageForStatus(response.status, extractApiMessage(raw)), response.status, parseBody(raw));
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, params: QueryParams = {}, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { params, signal, cache: shouldBypassHttpCache() ? 'reload' : undefined });
}

export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'POST', body, signal });
}

export function apiPatch<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'PATCH', body, signal });
}

export function apiDelete<T>(path: string, params: QueryParams = {}, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'DELETE', params, signal });
}
