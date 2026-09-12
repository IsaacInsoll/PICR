import { beforeAll, expect, test } from 'vitest';
import { join } from 'node:path';
import { mkdir, rename, rm, utimes, writeFile } from 'node:fs/promises';
// Backend's own Drizzle copy: `drizzle-orm` is a backend dependency, so a bare
// import cannot resolve from `tests/`. See tests/AGENTS.md.
import { eq } from '../../backend/node_modules/drizzle-orm/index.js';
import { db, initDb } from '../../backend/db/picrDb.js';
import { dbFile } from '../../backend/db/models/index.js';
import { backfillFileDerivedFields } from '../../backend/boot/backfillFileDerivedFields.js';
import { defaultCredentials } from '../../backend/auth/defaultCredentials.js';
import { normalizeSearchText } from '../../shared/files/mediaCriteria.js';
import { rescanFolderMutation } from '../../shared/urql/mutations/rescanFolderMutation.js';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery.js';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient.js';
import { testDatabaseUrl, videoFolderId } from './testVariables.js';

const videoFolderPath = join(
  process.cwd(),
  'tests/api/env/media/Birthday Video',
);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type TestClient = Awaited<ReturnType<typeof createTestGraphqlClient>>;
type DerivedPathFields = {
  relativePath: string;
  normalizedRelativePath: string | null;
  normalizedRelativePathSource: string | null;
};

// Direct database access is reserved for states GraphQL cannot produce, such
// as a derived value left stale by an older PICR version (see tests/AGENTS.md).
beforeAll(() => {
  process.env['DATABASE_URL'] = testDatabaseUrl;
  initDb();
});

test('derived-field backfill executes its guarded batch update in PostgreSQL', async () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const now = new Date();
  const [inserted] = await db
    .insert(dbFile)
    .values({
      createdAt: now,
      exists: true,
      existsRescan: true,
      fileCreated: now,
      fileHash: `derived-backfill-${suffix}`,
      fileLastModified: now,
      fileSize: 1,
      folderId: 1,
      metadata: JSON.stringify({
        DateTimeOriginal: '2025-04-03T12:01:00+10:00',
      }),
      name: `Café-${suffix}.txt`,
      rating: 0,
      relativePath: '',
      totalComments: 0,
      type: 'File',
      updatedAt: now,
    })
    .returning({ id: dbFile.id });
  expect(inserted).toBeDefined();
  if (!inserted) return;

  try {
    await backfillFileDerivedFields();
    const file = await db.query.dbFile.findFirst({
      where: (fields, { eq }) => eq(fields.id, inserted.id),
    });
    expect(file).toMatchObject({
      capturedAt: new Date('2025-04-03T02:01:00.000Z'),
      normalizedName: `cafe-${suffix}.txt`,
      normalizedNameSource: `Café-${suffix}.txt`,
      normalizedRelativePath: '',
      normalizedRelativePathSource: '',
    });
  } finally {
    await db.delete(dbFile).where(eq(dbFile.id, inserted.id));
  }
});

const viewFolder = async (client: TestClient, folderId: string) => {
  const result = await client.query(viewFolderQuery, { folderId }).toPromise();
  expect(result.error).toBeUndefined();
  return result.data?.folder;
};

const rescanVideoFolder = async (client: TestClient) => {
  const rescan = await client
    .mutation(rescanFolderMutation, { folderId: videoFolderId })
    .toPromise();
  expect(rescan.error).toBeUndefined();
};

// Same rationale as 10-rescan-folder: the scanner's settle window and Docker
// bind mounts can hide a fresh filesystem change from the first pass.
const rescanUntilFixtureIsReady = async (
  client: TestClient,
  folderName: string,
  directFileName: string,
  nestedFileName: string,
  attempts = 12,
) => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    await rescanVideoFolder(client);

    const parent = await viewFolder(client, videoFolderId);
    const fixture = parent?.subFolders.find(({ name }) => name === folderName);
    if (!fixture) {
      await sleep(1500);
      continue;
    }

    const fixtureFolder = await viewFolder(client, fixture.id);
    const nested = fixtureFolder?.subFolders.find(
      ({ name }) => name === 'Nested',
    );
    const directFile = fixtureFolder?.files.find(
      ({ name }) => name === directFileName,
    );
    if (!nested || !directFile) {
      await sleep(1500);
      continue;
    }

    const nestedFolder = await viewFolder(client, nested.id);
    const nestedFile = nestedFolder?.files.find(
      ({ name }) => name === nestedFileName,
    );
    if (nestedFile) {
      return { directFile, fixture, nested, nestedFile };
    }
    await sleep(1500);
  }
  return undefined;
};

const rescanUntilSubFolderNamed = async (
  client: TestClient,
  folderName: string,
  attempts = 12,
) => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    await rescanVideoFolder(client);
    const parent = await viewFolder(client, videoFolderId);
    const folder = parent?.subFolders.find(({ name }) => name === folderName);
    if (folder) return folder;
    await sleep(1500);
  }
  return undefined;
};

// A rename may prove a derived path current and carry it forward, or it may
// leave it null for post-boot repair. It must never keep a wrong value behind a
// source marker that looks current.
const expectDerivedPathFreshOrRepairable = (file: DerivedPathFields) => {
  if (file.normalizedRelativePathSource === null) {
    expect(file.normalizedRelativePath).toBeNull();
    return;
  }
  expect(file.normalizedRelativePathSource).toBe(file.relativePath);
  expect(file.normalizedRelativePath).toBe(
    normalizeSearchText(file.relativePath),
  );
};

// The rename mutation cannot run here because the API container mounts media
// read-only. Renaming on the host and rescanning drives the watcher-side
// renameFolder event instead (the scan matches the moved folder by inode),
// which uses the same prefix-replacement SQL as the mutation.
//
// Skipped under `act` for the bind-mount visibility reason documented in
// 10-rescan-folder; native CI runs it strictly.
test.skipIf(!!process.env.ACT)(
  'renames folder and file paths literally while preserving derived-field freshness',
  async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const sourceName = `rename-source-${suffix}`;
    const destinationName = `Rénamed (${suffix}).v1`;
    const directFileName = `direct-${suffix}.txt`;
    const nestedFileName = `nested-${suffix}.txt`;
    const sourcePath = join(videoFolderPath, sourceName);
    const destinationPath = join(videoFolderPath, destinationName);
    const nestedPath = join(sourcePath, 'Nested');
    const oldEnoughForFastPath = new Date(Date.now() - 120_000);
    const newRelativePath = `Birthday Video/${destinationName}`;

    await mkdir(nestedPath, { recursive: true });
    await writeFile(join(sourcePath, directFileName), `direct ${suffix}`);
    await writeFile(join(nestedPath, nestedFileName), `nested ${suffix}`);
    await utimes(
      join(sourcePath, directFileName),
      oldEnoughForFastPath,
      oldEnoughForFastPath,
    );
    await utimes(
      join(nestedPath, nestedFileName),
      oldEnoughForFastPath,
      oldEnoughForFastPath,
    );
    await utimes(nestedPath, oldEnoughForFastPath, oldEnoughForFastPath);
    await utimes(sourcePath, oldEnoughForFastPath, oldEnoughForFastPath);

    const client = await createTestGraphqlClient(
      await getUserHeader(defaultCredentials),
    );

    try {
      const fixture = await rescanUntilFixtureIsReady(
        client,
        sourceName,
        directFileName,
        nestedFileName,
      );
      expect(fixture).toBeDefined();
      if (!fixture) return;

      const fixtureId = Number(fixture.fixture.id);
      const nestedId = Number(fixture.nested.id);
      const directFileId = Number(fixture.directFile.id);
      const nestedFileId = Number(fixture.nestedFile.id);
      expect(
        [fixtureId, nestedId, directFileId, nestedFileId].every(
          Number.isInteger,
        ),
      ).toBe(true);

      // Simulate a derived path left stale by an older PICR version.
      await db
        .update(dbFile)
        .set({
          normalizedRelativePath: 'stale/path',
          normalizedRelativePathSource: 'stale/source',
        })
        .where(eq(dbFile.id, nestedFileId));

      await rename(sourcePath, destinationPath);
      const renamedFixture = await rescanUntilSubFolderNamed(
        client,
        destinationName,
      );
      // The same row proves the scan took the rename path rather than
      // archiving the old folder and importing a new one.
      expect(renamedFixture?.id).toBe(fixture.fixture.id);

      const [rootFolder, nestedFolder, directFile, nestedFile] =
        await Promise.all([
          db.query.dbFolder.findFirst({
            where: (fields, { eq }) => eq(fields.id, fixtureId),
          }),
          db.query.dbFolder.findFirst({
            where: (fields, { eq }) => eq(fields.id, nestedId),
          }),
          db.query.dbFile.findFirst({
            where: (fields, { eq }) => eq(fields.id, directFileId),
          }),
          db.query.dbFile.findFirst({
            where: (fields, { eq }) => eq(fields.id, nestedFileId),
          }),
        ]);

      expect(rootFolder?.relativePath).toBe(newRelativePath);
      expect(nestedFolder?.relativePath).toBe(`${newRelativePath}/Nested`);
      expect(directFile).toMatchObject({
        folderId: fixtureId,
        relativePath: newRelativePath,
        normalizedRelativePath: normalizeSearchText(newRelativePath),
        normalizedRelativePathSource: newRelativePath,
      });
      expect(nestedFile).toMatchObject({
        folderId: nestedId,
        relativePath: `${newRelativePath}/Nested`,
      });
      if (nestedFile) expectDerivedPathFreshOrRepairable(nestedFile);
    } finally {
      await rm(sourcePath, { recursive: true, force: true });
      await rm(destinationPath, { recursive: true, force: true });
      await rescanVideoFolder(client).catch(() => undefined);
    }
  },
  120_000,
);
