// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeXMLHttpRequest } from '../../support/fake-xhr';

beforeEach(() => {
  FakeXMLHttpRequest.instances.length = 0;
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  sessionStorage.setItem(
    'hevy-dashboard.session',
    JSON.stringify({
      accessToken: 'token-1',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 'u1', email: 'a@example.com', username: 'a.b', displayName: 'A', createdAt: '2026-01-01T00:00:00Z' },
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('CSV upload', () => {
  it('reports an expired session when the preview answers 401', async () => {
    vi.resetModules();
    const { onSessionExpired } = await import('@/lib/session-expiry');
    const { useHevyImport } = await import('@/composables/useHevyImport');
    const listener = vi.fn();
    onSessionExpired(listener);

    const { status, selectFile } = useHevyImport();
    selectFile(new File([new Uint8Array(10)], 'workouts.csv', { type: 'text/csv' }));
    FakeXMLHttpRequest.instances.at(-1)?.respond(401, JSON.stringify({ message: 'Invalid or expired token.' }));

    expect(listener).toHaveBeenCalledOnce();
    expect(status.value).toBe('error');
  });
});
