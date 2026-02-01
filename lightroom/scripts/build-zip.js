#!/usr/bin/env node
/**
 * Creates a release zip of the Lightroom plugin
 * Output: dist/picr-lightroom-v{version}.lrplugin.zip
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const pluginDir = join(rootDir, 'picr.lrplugin');
const distDir = join(rootDir, 'dist');

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

// Create dist directory
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const zipPath = join(distDir, `picr-lightroom-v${version}.lrplugin.zip`);
const output = createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(1);
  console.log(`Created ${zipPath} (${sizeKB} KB)`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add the plugin directory, excluding dev files
// The zip will contain: picr.lrplugin/Info.lua, picr.lrplugin/main.lua, etc.
archive.directory(pluginDir, 'picr.lrplugin', (entry) => {
  // Exclude dotfiles and dev files
  if (entry.name.startsWith('.')) {
    return false;
  }
  return entry;
});

archive.finalize();
