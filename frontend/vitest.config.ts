import { defineConfig } from 'vitest/config';
import { sharedAliases } from '../vitest.aliases.mjs';

export default defineConfig({
  resolve: { alias: sharedAliases },
  test: {
    include: ['src/**/*.unit.test.?(c|m)[jt]s?(x)'],
    testTimeout: 10_000,
  },
});
