import { afterEach } from 'vitest';

import { applyPreferences } from '@/utils/preferences';

afterEach(() => {
  applyPreferences({ weightUnit: 'kg', weekStart: 'monday' });
});
