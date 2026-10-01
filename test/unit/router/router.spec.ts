import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';

const routes = [
  { path: '/', name: 'home', component: { template: '<div />' } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

describe('single-page routing', () => {
  it.each(['/dashboard', '/workouts', '/workouts/abc', '/import', '/nonsense'])(
    'redirects the old deep link %s to the single page',
    async (path) => {
      const router = makeRouter();
      await router.push(path);
      expect(router.currentRoute.value.name).toBe('home');
      expect(router.currentRoute.value.path).toBe('/');
    },
  );

  it('keeps every filter in the query string', async () => {
    const router = makeRouter();
    await router.push({ name: 'home', query: { tab: 'workouts', search: 'push', page: '2' } });

    expect(router.currentRoute.value.fullPath).toBe('/?tab=workouts&search=push&page=2');
  });

  it('addresses a workout detail by query, not by path', async () => {
    const router = makeRouter();
    await router.push({ name: 'home', query: { tab: 'workouts', workout: 'abc-123' } });

    expect(router.currentRoute.value.path).toBe('/');
    expect(router.currentRoute.value.query.workout).toBe('abc-123');
  });
});
