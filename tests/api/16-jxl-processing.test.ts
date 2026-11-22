import { execFile } from 'node:child_process';
import { copyFile, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { initDb } from '../../backend/db/picrDb';
import { openSharp } from '../../backend/media/openSharp';
import { rescanFolderMutation } from '../../shared/urql/mutations/rescanFolderMutation';
import { serverInfoQuery } from '../../shared/urql/queries/serverInfoQuery';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { thumbnailVariantForWidth } from '../../shared/thumbnailVariants';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { testUrl, videoFolderId } from './testVariables';

// Like the rescan/move integration test, this exercises host-written files on a
// Docker bind mount. Nested act mounts cannot reliably expose these writes;
// native CI runs it, and the unit lane covers capability/failure decisions.
test.skipIf(!!process.env.ACT)(
  'JXL ingestion preserves orientation and metadata, serves JPEG previews, and keeps originals intact',
  async () => {
    const client = await createTestGraphqlClient(
      await getUserHeader(defaultCredentials),
    );
    const server = await client.query(serverInfoQuery, {}).toPromise();
    expect(server.error).toBeUndefined();
    expect(server.data?.serverInfo?.mediaCaps.jxl).toBe(true);

    const suffix = Math.random().toString(36).slice(2, 8);
    const samples = [
      {
        fixture: 'landscape.jxl',
        name: `jxl-${suffix}-landscape.jxl`,
        width: 320,
        height: 240,
      },
      {
        fixture: 'portrait-orientation-6.jxl',
        name: `jxl-${suffix}-portrait.JXL`,
        width: 120,
        height: 160,
      },
      {
        fixture: 'display-p3.jxl',
        name: `jxl-${suffix}-display-p3.jxl`,
        width: 256,
        height: 128,
      },
    ];
    const brokenName = `jxl-${suffix}-broken.jxl`;
    const brokenJpegName = `jxl-${suffix}-broken.jpg`;
    const names = [
      ...samples.map(({ name }) => name),
      brokenName,
      brokenJpegName,
    ];
    const directory = join(process.cwd(), 'tests/api/env/media/Birthday Video');
    const oldEnough = new Date(Date.now() - 120_000);
    const rescan = async () => {
      const result = await client
        .mutation(rescanFolderMutation, { folderId: videoFolderId })
        .toPromise();
      expect(result.error).toBeUndefined();
      expect(result.data?.rescanFolder).toBe(true);
    };
    const files = async () => {
      const result = await client
        .query(viewFolderQuery, { folderId: videoFolderId })
        .toPromise();
      expect(result.error).toBeUndefined();
      return result.data?.folder?.files ?? [];
    };
    let failed = false;
    try {
      for (const { fixture, name } of samples) {
        await copyFile(
          join(process.cwd(), 'tests/fixtures/jxl', fixture),
          join(directory, name),
        );
      }
      await writeFile(join(directory, brokenName), 'invalid JPEG XL fixture');
      await writeFile(join(directory, brokenJpegName), 'invalid JPEG fixture');
      for (const name of names)
        await utimes(join(directory, name), oldEnough, oldEnough);
      await expect
        .poll(
          async () => {
            await rescan();
            return (await files()).filter(({ name }) =>
              names.includes(name ?? ''),
            ).length;
          },
          { timeout: 30_000, interval: 1000 },
        )
        .toBe(names.length);

      const imported = await files();
      const variant = thumbnailVariantForWidth(250);
      for (const sample of samples) {
        const image = imported.find(({ name }) => name === sample.name);
        if (image?.__typename !== 'Image')
          throw new Error(`${sample.name} was not imported as an image`);
        expect(image.imageWidth).toBe(sample.width);
        expect(image.imageHeight).toBe(sample.height);
        expect(image.imageRatio).toBeCloseTo(sample.width / sample.height);
        expect(image.blurHash.length).toBeGreaterThan(20);
        // Inspect the production intermediate inside Docker, not the final
        // JPEG: a JPEG depth assertion cannot detect a 16-bit PNG regression.
        const { stdout } = await promisify(execFile)('docker', [
          'exec',
          'test-picr',
          'node',
          '--input-type=module',
          '-e',
          `import sharp from 'sharp';
           import { readdir } from 'node:fs/promises';
           import { dirname, basename, join } from 'node:path';
           import { picrConfig } from './server/backend/config/picrConfig.js';
           import { decodedImagePath } from './server/backend/media/decodedImagePath.js';
           picrConfig.mediaPath = join(process.cwd(), 'media');
           picrConfig.cachePath = join(process.cwd(), 'cache');
           const file = JSON.parse(process.argv[1]);
           const path = decodedImagePath(file, 'magick');
           const metadata = await sharp(path).metadata();
           const temporary = (await readdir(dirname(path))).filter(name =>
             name.startsWith(basename(path).replace(/\\.png$/, '')) && name.includes('.tmp'));
           console.log(JSON.stringify({depth: metadata.depth, bitsPerSample: metadata.bitsPerSample, temporary}));`,
          JSON.stringify({
            name: image.name,
            fileHash: image.fileHash,
            relativePath: 'Birthday Video',
          }),
        ]);
        expect(JSON.parse(stdout)).toEqual({
          depth: 'uchar',
          bitsPerSample: 8,
          temporary: [],
        });
        if (sample.fixture.startsWith('portrait')) {
          expect(image.metadata?.Camera).toBe('PICR Fixture JPEG XL Test');
          expect(image.metadata?.Rating).toBe(4);
        }
        const url = `${testUrl}image/${image.id}/${variant.token}/${image.fileHash}/${encodeURIComponent(sample.name)}`;
        const responses = await Promise.all([fetch(url), fetch(url)]);
        const bytes = await Promise.all(
          responses.map(async (response) => {
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toContain(
              'image/jpeg',
            );
            expect(response.headers.get('cache-control')).toBe(
              'public, max-age=86400',
            );
            return Buffer.from(await response.arrayBuffer());
          }),
        );
        expect(bytes[0]).toEqual(bytes[1]);
        const dimensions = await openSharp(bytes[0]).metadata();
        const scale = Math.min(
          1,
          variant.width / Math.max(sample.width, sample.height),
        );
        expect(dimensions.width).toBe(Math.round(sample.width * scale));
        expect(dimensions.height).toBe(Math.round(sample.height * scale));
        if (sample.fixture === 'display-p3.jxl') {
          // This reference was converted independently with ImageMagick/LCMS.
          // Dropping the P3 profile or quantizing it before conversion changes
          // this gradient well beyond the small cross-codec rounding allowance.
          const reference = await openSharp(
            join(process.cwd(), 'tests/fixtures/jxl/display-p3-srgb.png'),
          )
            .resize(variant.width, variant.width, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .withIccProfile('srgb')
            .jpeg({ quality: variant.quality })
            .toBuffer();
          const actualPixels = await openSharp(bytes[0]).raw().toBuffer();
          const referencePixels = await openSharp(reference).raw().toBuffer();
          expect(actualPixels.length).toBe(referencePixels.length);
          let maximumError = 0;
          let totalError = 0;
          for (let index = 0; index < actualPixels.length; index++) {
            const error = Math.abs(
              actualPixels[index] - referencePixels[index],
            );
            maximumError = Math.max(maximumError, error);
            totalError += error;
          }
          expect(maximumError).toBeLessThanOrEqual(6);
          expect(totalError / actualPixels.length).toBeLessThan(1);
        }
        const original = await fetch(
          `${testUrl}image/${image.id}/raw/${image.fileHash}/${sample.name}`,
        );
        expect(original.status).toBe(200);
        expect(Buffer.from(await original.arrayBuffer())).toEqual(
          await readFile(
            join(process.cwd(), 'tests/fixtures/jxl', sample.fixture),
          ),
        );
      }

      // Emulate an unchanged JXL indexed before the decoder became available.
      // FILE_WATCHER=off rescans must promote it without replacing its row.
      const promoted = imported.find(({ name }) => name === samples[0].name);
      if (!promoted) throw new Error('Missing promotion fixture');
      process.env['DATABASE_URL'] = 'postgres://user:pass@localhost:54313/picr';
      const pool = initDb();
      try {
        const failedRows = () =>
          pool.query<{
            name: string;
            type: string;
            imageDecodeAttempt: string | null;
            updatedAt: Date;
          }>(
            'SELECT name, type, "imageDecodeAttempt", "updatedAt" FROM "Files" WHERE name = ANY($1::text[]) ORDER BY name',
            [[brokenName, brokenJpegName]],
          );
        const before = (await failedRows()).rows;
        expect(before).toHaveLength(2);
        expect(before.find((row) => row.name === brokenName)).toMatchObject({
          type: 'File',
          imageDecodeAttempt: expect.stringMatching(/^jxl:\d+$/),
        });
        expect(before.find((row) => row.name === brokenJpegName)).toMatchObject(
          { type: 'File', imageDecodeAttempt: null },
        );
        await rescan();
        expect((await failedRows()).rows).toEqual(before);

        const savedState = await pool.query<{ mediaDecodeState: unknown }>(
          'SELECT "mediaDecodeState" FROM "ServerOptions"',
        );
        // Test an actual backend boot, preserving the database and cached files.
        // Failed classifications must not be decoded/logged/rewritten again.
        await promisify(execFile)('docker', ['restart', 'test-picr']);
        await expect
          .poll(
            async () => {
              const result = await client
                .query(serverInfoQuery, {})
                .toPromise();
              return result.data?.serverInfo?.mediaCaps.jxl;
            },
            { timeout: 30_000, interval: 500 },
          )
          .toBe(true);
        await rescan();
        expect((await failedRows()).rows).toEqual(before);
        expect(
          (
            await pool.query<{ mediaDecodeState: unknown }>(
              'SELECT "mediaDecodeState" FROM "ServerOptions"',
            )
          ).rows,
        ).toEqual(savedState.rows);

        await pool.query(
          'UPDATE "Files" SET type = $1, "imageWidth" = NULL, "imageHeight" = NULL, "imageDecodeAttempt" = NULL WHERE id = $2',
          ['File', promoted.id],
        );
      } finally {
        await pool.end();
      }
      expect(
        (await files()).find(({ id }) => id === promoted.id)?.__typename,
      ).toBe('File');
      await rescan();
      const reclassified = (await files()).find(({ id }) => id === promoted.id);
      expect(reclassified?.__typename).toBe('Image');
      if (reclassified?.__typename !== 'Image')
        throw new Error('Unchanged JXL was not promoted');
      expect(reclassified.fileHash).toBe(promoted.fileHash);
      expect(reclassified.imageWidth).toBe(samples[0].width);
      expect(reclassified.imageHeight).toBe(samples[0].height);

      const broken = imported.find(({ name }) => name === brokenName);
      if (!broken)
        throw new Error('Corrupt JXL was not retained as a generic file');
      expect(broken.__typename).toBe('File');
      const preview = await fetch(
        `${testUrl}image/${broken.id}/${variant.token}/${broken.fileHash}/${brokenName}`,
      );
      expect(preview.status).toBe(404);
      expect(preview.headers.get('cache-control')).toBeNull();
      const original = await fetch(
        `${testUrl}image/${broken.id}/raw/${broken.fileHash}/${brokenName}`,
      );
      expect(original.status).toBe(200);
      expect(await original.text()).toBe('invalid JPEG XL fixture');
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      // Cleanup must restore shared seed state without masking a test failure.
      try {
        for (const name of names)
          await rm(join(directory, name), { force: true });
        await rescan();
        await expect
          .poll(
            async () =>
              (await files()).some(({ name }) => names.includes(name ?? '')),
            { timeout: 10_000 },
          )
          .toBe(false);
      } catch (error) {
        if (!failed) throw error;
      }
    }
  },
  60_000,
);
