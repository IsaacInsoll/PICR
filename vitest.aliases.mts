import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

// Backend sources use NodeNext, so they import shared modules as
// `@shared/foo.js`. Every Vitest config that can load shared code must resolve
// those imports to the shared TypeScript source: the two root backend lanes and
// the frontend-owned unit-test lane. Keep this the single definition — lanes
// resolving `@shared` differently would make the same module behave differently
// depending on which test command loaded it.
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
