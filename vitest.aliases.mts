import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

// Backend sources use NodeNext, so they import shared modules as
// `@shared/foo.js`. Both Vitest configs need to resolve those to the shared
// TypeScript source: `vitest.unit.config.mts` for the fast Docker-free lane and
// `vite.config.mts` because it also discovers `*.unit.test.ts`. Keep this the
// single definition — the two lanes resolving `@shared` differently would make
// the same test file behave differently depending on which one ran it.
export const sharedAliases = [
  {
    find: /^@shared\/(.*)\.js$/,
    replacement: path.resolve(repoRoot, 'shared/$1.ts'),
  },
  {
    find: '@shared',
    replacement: path.resolve(repoRoot, 'shared'),
  },
];
