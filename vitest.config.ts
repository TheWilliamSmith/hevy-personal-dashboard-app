import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    // .env.development is not loaded in test mode; without this, apiUrl()
    // has no base and every request helper throws before fetch is reached.
    env: { VITE_API_URL: '/api' },
  },
});
