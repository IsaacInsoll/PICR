import type { GlobalSetupContext } from 'vitest/node';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import decompress from 'decompress';
import path from 'path';
import {
  buildOne,
  downMany,
  IDockerComposeOptions,
  upMany,
} from 'docker-compose';
import fs from 'fs';
import https from 'https';

// WE RUN TESTS IN DOCKER AS THERE HAVE BEEN MULTIPLE "WORKED IN DEV BUT NOT IN DOCKER" ISSUES WE WANT TO CATCH
// AND DOCKER IS OUR ONLY SUPPORTED PRODUCTION ENVIRONMENT

// note: service[0] is built, rest are just started
const services = ['test-picr', 'test-db'];

const composeOpts: IDockerComposeOptions = {
  cwd: path.join(__dirname, '..'),
  log: false,
};
export async function setup({ provide }: GlobalSetupContext) {
  // provide('wsPort', 3000)
  console.log('🧪 Test Setup Starting');
  const sampleFiles = 'https://photosummaryapp.com/picr-demo-data.zip';
  const samplePath = './tests/env/sample.zip';
  const media = './tests/env/media';
  const cache = './tests/env/cache';
  if (!existsSync(samplePath)) {
    console.log('\t⬇️ Sample files not found, downloading from ' + sampleFiles);
    mkdirSync('./tests/env', { recursive: true });
    await download(sampleFiles, samplePath);
  }
  rmSync(media, { recursive: true, force: true });
  rmSync(cache, { recursive: true, force: true });
  mkdirSync(media, { recursive: true });
  mkdirSync(cache, { recursive: true });
  console.log('\t📂 Decompressing sample files');
  await decompress(samplePath, media, { strip: 1 });
  console.log('\t🐋 Docker Starting');
  await buildOne(services[0], composeOpts);
  await upMany(services, composeOpts);
  console.log('\t🐋 Docker Startup Complete');
  //we need to wait a bit longer for everything to finish booting
  await new Promise((r) => setTimeout(r, 2000));

  // setupTestEnv();
  // console.log(picrConfig); #seems fine :)
  //server(); # Errors on this line because of sequelize-typescript missing decorators or something?

  console.log('🧪 Test Setup Complete');
}

export async function teardown() {
  console.log('🧪 Test Teardown Starting');
  await downMany(services, composeOpts);
  console.log('🧪 Test Teardown Complete');
}

function download(url, dest) {
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    let responseSent = false; // flag to make sure that response is sent only once.
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (responseSent) return;
            responseSent = true;
            resolve(null);
          });
        });
      })
      .on('error', (err) => {
        if (responseSent) return;
        responseSent = true;
        reject(err);
      });
  });
}
