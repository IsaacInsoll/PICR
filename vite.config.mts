import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // setupFiles: ['tests/setup-test-environment.ts'],
    globalSetup: ['tests/globalSetup.ts'],
  },
});
