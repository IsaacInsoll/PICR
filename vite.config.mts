import { defineConfig } from 'vitest/config';
import { async } from './tests/testSetup';

export default defineConfig({
  test: {
    include: ['tests/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // setupFiles seemed to setup/teardown between tests rather than once for the test run
    // setupFiles: ['tests/setup-test-environment.ts'],

    //globalSetup currently not being used but should work fine
    globalSetup: ['tests/testSetup.ts'],
    testTimeout: 20000,
  },
});
