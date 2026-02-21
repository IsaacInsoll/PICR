import { existsSync, mkdirSync, rmSync } from 'node:fs';
import decompress from 'decompress';
import {
  buildOne,
  downMany,
  type IDockerComposeOptions,
  upMany,
} from 'docker-compose';
import fs from 'node:fs';
import https from 'node:https';
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
  const sampleFiles = 'https://photosummaryapp.com/picr-demo-data.zip';
  const samplePath = './tests/api/env/sample.zip';
  const media = './tests/api/env/media';
  const cache = './tests/api/env/cache';
  if (!existsSync(samplePath)) {
    console.log('\t⬇️ Sample files not found, downloading from ' + sampleFiles);
    mkdirSync('./tests/api/env', { recursive: true });
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
  await new Promise((r) => setTimeout(r, 2000));
  console.log('🧪 Test Setup Complete');
}

export async function teardownTestEnvironment() {
  console.log('🧪 Test Teardown Starting');
  await downMany(services, composeOpts);
  console.log('🧪 Test Teardown Complete');
}

function download(url: string, dest: string) {
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    let responseSent = false;
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
