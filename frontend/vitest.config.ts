import { defineConfig } from 'vitest/config';
import { sharedAliases } from '../vitest.aliases.mjs';

export default defineConfig({
  // Match the production Vite resolver when components render shared hooks.
  resolve: { alias: sharedAliases, dedupe: ['react', 'react-dom', 'jotai'] },
  test: {
    include: ['src/**/*.unit.test.?(c|m)[jt]s?(x)'],
    testTimeout: 10_000,
  },
});
