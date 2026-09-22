/** Single source of truth for the API origin; every caller builds URLs from here. */
export const API_URL: string = import.meta.env.VITE_API_URL;

export function apiUrl(path: string): string {
  return `${API_URL.replace(/\/$/, '')}${path}`;
}

/** Nest's default error body: `message` is a string, or an array from ValidationPipe. */
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

/** Thrown by apiGet so callers can branch on the HTTP status. */
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

/** Drops empty params so `?search=` never reaches the API. */
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

/**
 * GET + JSON, with the caller's AbortSignal passed straight through so a
 * superseded request can be cancelled. Aborts surface as the native
 * AbortError DOMException, never as an ApiError — callers ignore them.
 */
export async function apiGet<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path) + buildQuery(params), { signal });
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

  // Server messages above 500 can carry stack traces; keep them out of the UI.
  if (status >= 500) {
    return 'The server failed to answer. Try again in a moment.';
  }

  return apiMessage ?? `Request failed (HTTP ${status}).`;
}
