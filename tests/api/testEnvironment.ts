import { existsSync, mkdirSync, rmSync } from 'node:fs';
import {
  buildOne,
  downMany,
  type IDockerComposeOptions,
  upMany,
} from 'docker-compose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const services = ['test-picr', 'test-db'];
const testApiDir = path.dirname(fileURLToPath(import.meta.url));

const composeOpts: IDockerComposeOptions = {
  cwd: testApiDir,
  log: false,
};

export async function setupTestEnvironment() {
  console.log('🧪 Test Setup Starting');
  const media = './tests/api/env/media';
  const cache = './tests/api/env/cache';
  if (!existsSync(media)) {
    throw new Error(
      `Test media not found at ${media}. Fixtures are committed to the repo — check your working tree.`,
    );
  }
  rmSync(cache, { recursive: true, force: true });
  mkdirSync(cache, { recursive: true });
  console.log('\t🐋 Docker Starting');
  await buildOne(services[0], composeOpts);
  await upMany(services, composeOpts);
  console.log('\t🐋 Docker Startup Complete');
  await new Promise((r) => setTimeout(r, 2000));
  console.log('🧪 Test Setup Complete');
}

export async function teardownTestEnvironment() {
  console.log('🧪 Test Teardown Starting');
  await downMany(services, composeOpts);
  console.log('🧪 Test Teardown Complete');
}
