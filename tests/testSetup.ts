import type { GlobalSetupContext } from 'vitest/node';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import decompress from 'decompress';
import path from 'path';
import { buildOne, downMany, upMany } from 'docker-compose';
import { Readable } from 'node:stream';
import fs from 'fs';

// note: service[0] is built, rest are just started
const services = ['test-picr', 'test-db'];

const composeOpts = { cwd: path.join(__dirname), log: true };

export async function setup({ provide }: GlobalSetupContext) {
  // provide('wsPort', 3000)
  const sampleFiles = 'https://photosummaryapp.com/picr-demo-data.zip';
  const samplePath = 'tests/env/sample.zip';
  const media = 'tests/env/media';
  const cache = 'tests/env/cache';
  if (!existsSync(samplePath)) {
    console.log('Sample files not found, downloading from ' + sampleFiles);
    await download(sampleFiles, samplePath);
  }
  rmSync(media, { recursive: true, force: true });
  rmSync(cache, { recursive: true, force: true });
  mkdirSync(media);
  mkdirSync(cache);
  await decompress(samplePath, media);

  await buildOne(services[0], composeOpts);
  await upMany(services, composeOpts);

  //we need to wait a bit longer for everything to finish booting
  await new Promise((r) => setTimeout(r, 2000));

  // setupTestEnv();
  // console.log(picrConfig); #seems fine :)
  //server(); # Errors on this line because of sequelize-typescript missing decorators or something?

  console.log('Test Setup Complete');
}

export async function teardown() {
  await downMany(services, composeOpts);
  console.log('Test Teardown Complete');
}

// declare module 'vitest' {
//   export interface ProvidedContext {
//     wsPort: number
//   }
// }

const download = async (url, path) =>
  Readable.fromWeb((await fetch(url)).body).pipe(fs.createWriteStream(path));

// const setupTestEnv = () => {
//   const testConfig: IPicrConfiguration = {
//     tokenSecret: 'TEST ENVIRONMENT',
//     databaseUrl: 'postgres://user:pass@localhost:54322/picr',
//     usePolling: true,
//     port: 6999,
//     pollingInterval: 20,
//     version: getVersion(),
//     mediaPath: path.join(process.cwd(), '/env/media'),
//     cachePath: path.join(process.cwd(), '/env/cache'),
//   };
//   for (const [key, value] of Object.entries(testConfig)) {
//     picrConfig[key] = value;
//   }
// };

export const testUrl = 'http://localhost:6901/';
