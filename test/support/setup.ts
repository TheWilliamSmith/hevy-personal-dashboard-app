import { afterEach } from 'vitest';

import { applyPreferences, applyTheme } from '@/utils/preferences';

afterEach(() => {
  applyPreferences({ weightUnit: 'kg', weekStart: 'monday' });
  applyTheme('system');
});
