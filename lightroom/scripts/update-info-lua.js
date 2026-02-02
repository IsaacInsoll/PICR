#!/usr/bin/env node
/**
 * Updates the version in Info.lua only
 * (package.json is updated by release-it)
 *
 * Usage: node update-info-lua.js <version>
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = process.argv[2];

if (!version) {
  console.error('Usage: node update-info-lua.js <version>');
  process.exit(1);
}

// Parse semver
const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match) {
  console.error(`Invalid version format: ${version} (expected: major.minor.patch)`);
  process.exit(1);
}

const [, major, minor, revision] = match;

// Update Info.lua
const infoPath = join(__dirname, '../picr.lrplugin/Info.lua');
let infoContent = readFileSync(infoPath, 'utf8');

// Replace VERSION block
infoContent = infoContent.replace(
  /VERSION\s*=\s*\{[^}]+\}/,
  `VERSION = {\n    major = ${major},\n    minor = ${minor},\n    revision = ${revision},\n  }`
);

writeFileSync(infoPath, infoContent);
console.log(`Updated Info.lua to version ${version}`);
