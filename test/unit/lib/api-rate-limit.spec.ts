import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiPost } from '@/lib/api';
import { jsonResponse } from '@/test/router-harness';

afterEach(() => vi.unstubAllGlobals());

describe('429 responses', () => {
  it('keep the API message, which says how long to wait', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ statusCode: 429, message: 'Too many attempts. Try again in 15 minutes.' }, 429)),
    );

    await expect(apiPost('/auth/sign-in', {})).rejects.toMatchObject({
      status: 429,
      message: 'Too many attempts. Try again in 15 minutes.',
    });
  });

  it('fall back to a generic message without a body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })));

    await expect(apiPost('/auth/password/forgot', {})).rejects.toMatchObject({
      message: 'Too many attempts. Wait a moment and try again.',
    });
  });
});
