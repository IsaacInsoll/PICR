import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.unit.test.?(c|m)[jt]s?(x)'],
    testTimeout: 10_000,
  },
});
