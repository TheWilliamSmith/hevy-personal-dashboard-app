import { describe, expect, it } from 'vitest';

describe('echarts registration', () => {
  it('registers the chart types and renderer without throwing', async () => {
    await expect(import('./echarts')).resolves.toBeDefined();
  });
});
