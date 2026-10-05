// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import Sparkline from '@/components/charts/Sparkline.vue';
import { mountWith } from '../../../support/mount';

describe('Sparkline', () => {
  it('draws a line from two points', async () => {
    const { wrapper } = await mountWith(Sparkline, { props: { points: [1, 3], color: 'red', label: 'Volume trend' } });
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('shows a dash with a readable label when there is not enough data', async () => {
    const { wrapper } = await mountWith(Sparkline, { props: { points: [1], color: 'red', label: 'Volume trend' } });
    expect(wrapper.find('svg').exists()).toBe(false);
    expect(wrapper.find('[aria-hidden="true"]').text()).toBe('—');
    expect(wrapper.find('.sr-only').text()).toBe('Volume trend');
  });
});
