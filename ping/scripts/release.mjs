import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const pingRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(pingRoot, '..');
const bump = process.argv[2];

const fail = (message) => {
  process.stderr.write(`[release:ping] ${message}\n`);
  process.exit(1);
};

const run = (command, args, cwd = repoRoot) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'inherit' });

const output = (command, args, cwd = repoRoot) =>
  execFileSync(command, args, { cwd, encoding: 'utf8' }).trim();

if (!['patch', 'minor', 'major'].includes(bump)) {
  fail('Usage: npm run release:ping -- patch|minor|major');
}
if (output('git', ['branch', '--show-current']) !== 'master') {
  fail('Ping releases must be created from master.');
}
if (output('git', ['status', '--porcelain'])) {
  fail('The working tree must be clean.');
}

run('git', ['fetch', '--quiet', 'origin', 'master']);
if (
  output('git', ['rev-parse', 'HEAD']) !==
  output('git', ['rev-parse', 'origin/master'])
) {
  fail('Local master must exactly match origin/master before releasing.');
}

run('npm', ['version', bump, '--no-git-tag-version'], pingRoot);
run('npm', ['run', 'format']);
run('npm', ['run', 'format:check']);
run('npm', ['run', 'lint'], pingRoot);
run('npm', ['run', 'typecheck'], pingRoot);
run('npm', ['test'], pingRoot);

const packageJson = JSON.parse(
  readFileSync(resolve(pingRoot, 'package.json'), 'utf8'),
);
const version = packageJson.version;
if (typeof version !== 'string') fail('ping/package.json has no version.');

run('git', ['add', 'ping/package.json', 'ping/package-lock.json']);
run('git', ['commit', '-m', `🚀 [ping] release v${version}`]);
process.stdout.write(
  `[release:ping] Created v${version}. Review the commit, then push master to publish.\n`,
);
