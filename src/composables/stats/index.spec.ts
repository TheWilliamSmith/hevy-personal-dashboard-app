import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flushPromises, jsonResponse } from '@/test/router-harness';

import { useStatsCalendar, useStatsDistribution, useStatsOverview, useStatsTimeseries } from './index';

afterEach(() => vi.unstubAllGlobals());

describe('stats resources', () => {
  it('fetches the overview for a range', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse({ totalWorkouts: 10 }));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    const resource = scope.run(() => useStatsOverview(() => ({ from: '2026-01-01' })))!;
    await flushPromises();

    expect(resource.data.value).toEqual({ totalWorkouts: 10 });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/stats/overview');
    scope.stop();
  });

  it('fetches a timeseries with metric and granularity', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    scope.run(() => useStatsTimeseries(() => ({}), () => 'volume', () => 'week'));
    await flushPromises();

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/stats/timeseries');
    expect(url).toContain('metric=volume');
    expect(url).toContain('granularity=week');
    scope.stop();
  });

  it('fetches a distribution for a dimension', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    scope.run(() => useStatsDistribution(() => ({}), () => 'weekday'));
    await flushPromises();

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/stats/distribution');
    expect(url).toContain('dimension=weekday');
    scope.stop();
  });

  it('fetches the calendar for a year', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const scope = effectScope();
    scope.run(() => useStatsCalendar(() => 2026));
    await flushPromises();

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/stats/calendar');
    expect(url).toContain('year=2026');
    scope.stop();
  });
});
