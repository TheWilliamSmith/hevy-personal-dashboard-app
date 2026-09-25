import { describe, expect, it } from 'vitest';

import { flushPromises, withRouter } from '@/test/router-harness';

import { useDashboardFilters } from './useDashboardFilters';

describe('useDashboardFilters', () => {
  it('defaults to a 30 day range and a daily granularity', async () => {
    const { result } = await withRouter({}, () => useDashboardFilters());
    expect(result.preset.value).toBe('30d');
    expect(result.granularity.value).toBe('day');
    expect(result.range.value.from).toBeDefined();
    expect(result.comparisonLabel.value).toBe('vs previous 30 days');
  });

  it('switches to a monthly granularity for the 1y and all presets', async () => {
    const oneYear = await withRouter({ range: '1y' }, () => useDashboardFilters());
    expect(oneYear.result.granularity.value).toBe('month');

    const all = await withRouter({ range: 'all' }, () => useDashboardFilters());
    expect(all.result.granularity.value).toBe('month');
    expect(all.result.range.value).toEqual({});
    expect(all.result.comparisonLabel.value).toBe('vs previous period');
  });

  it('respects an explicit granularity override', async () => {
    const { result } = await withRouter({ range: '1y', granularity: 'day' }, () => useDashboardFilters());
    expect(result.granularity.value).toBe('day');
  });

  it('builds a custom range from from/to', async () => {
    const { result } = await withRouter(
      { range: 'custom', from: '2026-01-01', to: '2026-01-31' },
      () => useDashboardFilters(),
    );
    expect(result.preset.value).toBe('custom');
    expect(result.range.value.from).toBe('2026-01-01T00:00:00.000Z');
    expect(result.range.value.to).toBe('2026-01-31T23:59:59.999Z');
  });

  it('falls back to the current year when none is given', async () => {
    const { result } = await withRouter({}, () => useDashboardFilters());
    expect(result.year.value).toBe(new Date().getUTCFullYear());
  });

  it('reads an explicit year', async () => {
    const { result } = await withRouter({ year: '2024' }, () => useDashboardFilters());
    expect(result.year.value).toBe(2024);
  });

  it('pushes the preset to the query, dropping it for the 30d default', async () => {
    const { result, router } = await withRouter({ range: '6m' }, () => useDashboardFilters());
    result.setPreset('30d');
    await flushPromises();
    expect(router.currentRoute.value.query.range).toBeUndefined();

    result.setPreset('3m');
    await flushPromises();
    expect(router.currentRoute.value.query.range).toBe('3m');
  });

  it('pushes a custom range', async () => {
    const { result, router } = await withRouter({}, () => useDashboardFilters());
    result.setCustomRange('2026-02-01', '2026-02-28');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({
      range: 'custom',
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('pushes the granularity and the year', async () => {
    const { result, router } = await withRouter({}, () => useDashboardFilters());
    result.setGranularity('week');
    await flushPromises();
    expect(router.currentRoute.value.query.granularity).toBe('week');

    result.setYear(2023);
    await flushPromises();
    expect(router.currentRoute.value.query.year).toBe('2023');
  });

  it('keeps a non-dashboard tab in the query when pushing filters', async () => {
    const { result, router } = await withRouter({ tab: 'progress' }, () => useDashboardFilters());
    result.setGranularity('week');
    await flushPromises();
    expect(router.currentRoute.value.query.tab).toBe('progress');
  });
});
