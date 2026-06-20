#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [version, tagName] = process.argv.slice(2);

const fail = (message) => {
  console.error(`[verify-release] ${message}`);
  process.exit(1);
};

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    fail(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : '.'}`);
  }
};

if (!version) {
  fail('Missing release version argument.');
}

if (!tagName) {
  fail('Missing release tag argument.');
}

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

if (packageJson.version !== version) {
  fail(`package.json version is ${packageJson.version}, expected ${version}.`);
}

const headCommit = git(['rev-parse', 'HEAD']);
const tagCommit = git(['rev-parse', `${tagName}^{commit}`]);

if (tagCommit !== headCommit) {
  fail(`Tag ${tagName} points at ${tagCommit}, expected HEAD ${headCommit}.`);
}

const taggedPackageJson = JSON.parse(git(['show', `${tagName}:package.json`]));

if (taggedPackageJson.version !== version) {
  fail(
    `Tag ${tagName} contains package.json version ${taggedPackageJson.version}, expected ${version}.`,
  );
}

console.log(
  `[verify-release] ${tagName} points at HEAD and contains version ${version}.`,
);
