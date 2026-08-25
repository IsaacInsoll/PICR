import { defineConfig } from 'vitest/config';
import { sharedAliases } from './vitest.aliases.mjs';

// Fast, Docker-free unit tests for pure backend and shared primitives (no
// globalSetup, no container). Run with `npm run test:unit`.
//
// These files are ALSO matched by the main `vite.config.mts` include, so they
// still run under `npm run test:api` in CI — this config is purely a faster
// local lens for iterating without the Docker buildout.
//
// Convention: name unit tests `*.unit.test.ts` so this glob picks them up.
export default defineConfig({
  resolve: { alias: sharedAliases },
  test: {
    include: ['tests/**/*.unit.test.?(c|m)[jt]s?(x)'],
    testTimeout: 10000,
  },
});
