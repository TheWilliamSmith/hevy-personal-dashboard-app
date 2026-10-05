import { flushPromises, mount, type ComponentMountingOptions } from '@vue/test-utils';
import { vi } from 'vitest';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';

import { useToasts } from '@/composables/useToasts';
import { i18n } from '@/i18n';

const blank = { render: () => null };

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: blank },
  { path: '/sign-in', name: 'sign-in', component: blank, meta: { layout: 'auth' } },
  { path: '/sign-up', name: 'sign-up', component: blank, meta: { layout: 'auth' } },
  { path: '/forgot-password', name: 'forgot-password', component: blank, meta: { layout: 'auth' } },
  { path: '/reset-password', name: 'reset-password', component: blank, meta: { layout: 'auth' } },
  { path: '/recap/unsubscribe', name: 'recap-unsubscribe', component: blank, meta: { layout: 'auth' } },
  { path: '/verify-email', name: 'verify-email', component: blank, meta: { layout: 'auth' } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

export interface MountOptions {
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
  route?: { name?: string; query?: Record<string, string> };
  stubs?: Record<string, unknown>;
}

export async function mountWith(component: Component, options: MountOptions = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push({ name: options.route?.name ?? 'home', query: options.route?.query ?? {} });
  await router.isReady();

  const wrapper = mount(component as never, {
    props: options.props,
    slots: options.slots,
    attachTo: document.body,
    global: {
      plugins: [router, i18n],
      stubs: { teleport: true, BaseChart: true, ...options.stubs },
    },
  } as ComponentMountingOptions<never>);
  await flushPromises();
  return { wrapper, router };
}

export type FetchHandler = (url: string, init: RequestInit | undefined) => unknown;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function stubFetch(handler: FetchHandler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const result = handler(url, init);
    return result instanceof Response ? result : jsonResponse(result ?? {});
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function parseBody(body: BodyInit | null | undefined): unknown {
  if (body === undefined || body === null) {
    return undefined;
  }
  return typeof body === 'string' ? JSON.parse(body) : body;
}

export function requestsTo(fetchMock: ReturnType<typeof stubFetch>, fragment: string): Array<{ method: string; body: unknown }> {
  return fetchMock.mock.calls
    .filter(([input]) => String(input).includes(fragment))
    .map(([, init]) => ({
      method: (init as RequestInit | undefined)?.method ?? 'GET',
      body: parseBody((init as RequestInit | undefined)?.body),
    }));
}

export { flushPromises };

export function clearToasts(): void {
  const { toasts, dismiss } = useToasts();
  for (const toast of [...toasts.value]) {
    dismiss(toast.id);
  }
}
