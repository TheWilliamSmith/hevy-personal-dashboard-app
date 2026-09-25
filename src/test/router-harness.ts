import { createApp, effectScope, type App, type EffectScope } from 'vue';
import { createMemoryHistory, createRouter, type Router, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: { render: () => null } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

export interface RouterHarness<T> {
  result: T;
  router: Router;
  app: App;
  scope: EffectScope;
  stop: () => void;
}

export async function withRouter<T>(
  query: Record<string, string>,
  fn: () => T,
): Promise<RouterHarness<T>> {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push({ name: 'home', query });

  const app = createApp({ render: () => null });
  app.use(router);

  const scope = effectScope(true);
  let result!: T;
  app.runWithContext(() => {
    scope.run(() => {
      result = fn();
    });
  });

  return { result, router, app, scope, stop: () => scope.stop() };
}

export const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
