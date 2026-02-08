import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    slowTestThreshold: 1500, // Slow tests: ServerInfo queries github, Thumbnail generation: it's even slower in github CI
    fileParallelism: false, // Tests share database state, so they must run sequentially

    // setupFiles seemed to setup/teardown between tests rather than once for the test run
    // setupFiles: ['tests/setup-test-environment.ts'],

    globalSetup: ['tests/testSetup.ts'],
    testTimeout: 20000,
  },
});
