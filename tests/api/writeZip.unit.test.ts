import { afterEach, expect, test, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { extractZip } from '../../backend/helpers/extractZip.js';

vi.mock('../../backend/logger.js', () => ({ log: vi.fn() }));
const directories: string[] = [];
const fixture = async () => {
  const directory = await mkdtemp(join(tmpdir(), 'picr-zip-'));
  directories.push(directory);
  const source = join(directory, 'source.cr3');
  await writeFile(source, Buffer.from('original RAW bytes'));
  return {
    directory,
    source,
    destination: join(directory, 'cache', 'gallery.zip'),
  };
};

afterEach(async () => {
  vi.doUnmock('node:fs');
  vi.resetModules();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

test('publishes a readable stored ZIP64 archive with exact original bytes and no partial file', async () => {
  const { directory, source, destination } = await fixture();
  const { writeZip } = await import('../../backend/helpers/writeZip.js');
  const progress = vi.fn();
  await writeZip(
    destination,
    [{ path: source, name: 'nested/source.cr3' }],
    progress,
  );
  expect(await readdir(join(directory, 'cache'))).toEqual(['gallery.zip']);
  expect(progress).toHaveBeenLastCalledWith(1);
  const bytes = await readFile(destination);
  expect(bytes.readUInt32LE(0)).toBe(0x04034b50); // Local file header.
  expect(bytes.readUInt16LE(8)).toBe(0); // ZIP method 0 = STORE, no deflate.
  expect(bytes.includes(Buffer.from([0x50, 0x4b, 0x06, 0x06]))).toBe(true);
  const extracted = join(directory, 'extracted');
  await extractZip(destination, extracted);
  expect(await readdir(extracted)).toEqual(['nested']);
  expect(await readFile(join(extracted, 'nested', 'source.cr3'))).toEqual(
    await readFile(source),
  );
});

test('a missing source fails without publishing an incomplete archive and can be retried', async () => {
  const { directory, source, destination } = await fixture();
  const { writeZip } = await import('../../backend/helpers/writeZip.js');
  await expect(
    writeZip(
      destination,
      [{ path: source + '.missing', name: 'missing.cr3' }],
      vi.fn(),
    ),
  ).rejects.toMatchObject({ code: 'ENOENT' });
  expect(await readdir(join(directory, 'cache'))).toEqual([]);
  await writeZip(destination, [{ path: source, name: 'source.cr3' }], vi.fn());
  expect(await readdir(join(directory, 'cache'))).toEqual(['gallery.zip']);
});

test('destination stream errors reject cleanly and do not publish a ZIP', async () => {
  const { directory, source, destination } = await fixture();
  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    createWriteStream: () =>
      new Writable({
        write(_chunk, _encoding, callback) {
          callback(Object.assign(new Error('disk full'), { code: 'ENOSPC' }));
        },
      }),
  }));
  const { writeZip } = await import('../../backend/helpers/writeZip.js');
  await expect(
    writeZip(destination, [{ path: source, name: 'source.cr3' }], vi.fn()),
  ).rejects.toMatchObject({ code: 'ENOSPC' });
  expect(await readdir(join(directory, 'cache'))).toEqual([]);
});

test('the final cache file stays absent until destination completion', async () => {
  const { directory, source, destination } = await fixture();
  const finish = Promise.withResolvers<void>();
  let waitingForFinish = false;
  vi.doMock('node:fs', async (importOriginal) => {
    const original = await importOriginal<typeof import('node:fs')>();
    return {
      ...original,
      createWriteStream: (
        path: string,
        options: Parameters<typeof original.createWriteStream>[1],
      ) => {
        const target = original.createWriteStream(path, options);
        const output = new Writable({
          write(chunk, encoding, callback) {
            target.write(chunk, encoding, callback);
          },
          final(callback) {
            target.end(() => {
              waitingForFinish = true;
              void finish.promise.then(() => callback());
            });
          },
          destroy(error, callback) {
            target.destroy();
            callback(error);
          },
        });
        target.on('error', (error) => output.destroy(error));
        return output;
      },
    };
  });
  const { writeZip } = await import('../../backend/helpers/writeZip.js');
  const written = writeZip(
    destination,
    [{ path: source, name: 'source.cr3' }],
    vi.fn(),
  );
  await vi.waitFor(() => expect(waitingForFinish).toBe(true));
  const cacheFiles = await readdir(join(directory, 'cache'));
  expect(cacheFiles).toHaveLength(1);
  expect(cacheFiles[0]).toMatch(/\.partial$/);
  finish.resolve();
  await written;
  expect(await readdir(join(directory, 'cache'))).toEqual(['gallery.zip']);
});
