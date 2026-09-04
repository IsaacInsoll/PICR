import { readFileSync } from 'node:fs';

const readPackage = (relativePath) =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));

const appPackage = readPackage('../package.json');
const sharedPackage = readPackage('../../shared/package.json');
const sharedRuntimeDependencies = [
  ...Object.keys(sharedPackage.dependencies ?? {}),
  ...Object.keys(sharedPackage.peerDependencies ?? {}),
].sort();
const missingDependencies = sharedRuntimeDependencies.filter(
  (dependency) => !appPackage.dependencies?.[dependency],
);

if (missingDependencies.length > 0) {
  console.error(
    `The app must directly declare shared runtime dependencies:\n${missingDependencies
      .map((dependency) => `- ${dependency}`)
      .join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `The app directly declares all ${sharedRuntimeDependencies.length} shared runtime dependencies.`,
  );
}
