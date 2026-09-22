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
