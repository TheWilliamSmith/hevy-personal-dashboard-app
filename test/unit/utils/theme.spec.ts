// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { chartPalette } from '@/charts/theme';
import { applyTheme, resolvedTheme, theme } from '@/utils/preferences';

type Listener = (event: { matches: boolean }) => void;

function stubSystem(dark: boolean) {
  const listeners: Listener[] = [];
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: dark, addEventListener: (_: string, listener: Listener) => listeners.push(listener) })),
  );
  return (next: boolean) => listeners.forEach((listener) => listener({ matches: next }));
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('theme preference', () => {
  it('applies a chosen theme to the page and remembers it', async () => {
    applyTheme('light');
    await nextTick();

    expect(theme.value).toBe('light');
    expect(resolvedTheme.value).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(JSON.parse(localStorage.getItem('hevy-dashboard.preferences') ?? '{}')).toMatchObject({ theme: 'light' });

    applyTheme('dark');
    await nextTick();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('follows the device in system mode, live', async () => {
    const changeSystem = stubSystem(false);
    vi.resetModules();
    const preferences = await import('@/utils/preferences');

    expect(preferences.theme.value).toBe('system');
    expect(preferences.resolvedTheme.value).toBe('light');
    await nextTick();
    expect(document.documentElement.dataset.theme).toBe('light');

    changeSystem(true);
    await nextTick();
    expect(preferences.resolvedTheme.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('starts from the remembered theme', async () => {
    localStorage.setItem('hevy-dashboard.preferences', JSON.stringify({ weightUnit: 'kg', weekStart: 'monday', theme: 'light' }));
    stubSystem(true);
    vi.resetModules();
    const preferences = await import('@/utils/preferences');

    expect(preferences.theme.value).toBe('light');
    expect(preferences.resolvedTheme.value).toBe('light');
  });

  it('ignores an unknown remembered theme', async () => {
    localStorage.setItem('hevy-dashboard.preferences', JSON.stringify({ theme: 'sepia' }));
    stubSystem(true);
    vi.resetModules();
    const preferences = await import('@/utils/preferences');

    expect(preferences.theme.value).toBe('system');
    expect(preferences.resolvedTheme.value).toBe('dark');
  });

  it('gives charts the palette of the current theme', () => {
    applyTheme('light');
    expect(chartPalette()).toMatchObject({ tooltipBackground: '#ffffff', splitLine: '#e4e4e7' });

    applyTheme('dark');
    expect(chartPalette()).toMatchObject({ tooltipBackground: '#18181b', splitLine: '#27272a' });
  });
});

describe('theme before the app starts', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

  function run(): string | undefined {
    new Function(script)();
    return document.documentElement.dataset.theme;
  }

  it('sets the remembered theme on the page before any style is drawn', () => {
    stubSystem(true);
    localStorage.setItem('hevy-dashboard.preferences', JSON.stringify({ theme: 'light' }));
    expect(run()).toBe('light');

    localStorage.setItem('hevy-dashboard.preferences', JSON.stringify({ theme: 'dark' }));
    expect(run()).toBe('dark');
  });

  it('follows the device when nothing usable is remembered', () => {
    stubSystem(false);
    expect(run()).toBe('light');

    localStorage.setItem('hevy-dashboard.preferences', '{broken');
    stubSystem(true);
    expect(run()).toBe('dark');
  });

  it('runs before the app script', () => {
    expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('src="/src/main.ts"'));
  });
});
