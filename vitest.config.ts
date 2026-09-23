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
    coverage: {
      provider: 'v8',
      // text: summary in the terminal; html: browsable report in coverage/;
      // lcov: for editor gutters and CI services.
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      // Every TypeScript source file, tested or not: an untested file shows up
      // at 0 % instead of silently disappearing from the report.
      // .vue files are left out: with no component test environment, the
      // provider cannot parse an SFC nothing imported and throws PARSE_ERROR.
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/types/**', 'src/main.ts'],
    },
  },
});
