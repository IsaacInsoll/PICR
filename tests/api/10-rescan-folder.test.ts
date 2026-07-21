import { expect, test } from 'vitest';
import { join } from 'node:path';
import { rename, rm, utimes, writeFile } from 'node:fs/promises';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { rescanFolderMutation } from '../../shared/urql/mutations/rescanFolderMutation';
import { videoFolderId } from './testVariables';

const videoFolderPath = join(
  process.cwd(),
  'tests/api/env/media/Birthday Video',
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type TestClient = Awaited<ReturnType<typeof createTestGraphqlClient>>;

const findFileNamed = async (client: TestClient, name: string) => {
  const result = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(result.error).toBeUndefined();
  return result.data?.folder?.files.find((file) => file.name === name);
};

// The scanner has a ~10s settle window (SCAN_SETTLE_SECONDS) and, under Docker
// bind mounts, a just-written/renamed file may not be visible to the backend on
// the first pass. A single rescan can therefore complete without importing it,
// which is not a product bug — the next scan picks it up. So rescan + re-check
// on a loop until the file appears (or we give up, which correctly fails the
// test if it genuinely never imports).
const rescanUntilFound = async (
  client: TestClient,
  name: string,
  attempts = 24,
  gapMs = 2000,
) => {
  let found: Awaited<ReturnType<typeof findFileNamed>>;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const rescan = await client
      .mutation(rescanFolderMutation, { folderId: videoFolderId })
      .toPromise();
    expect(rescan.error).toBeUndefined();
    expect(rescan.data?.rescanFolder).toBe(true);

    found = await findFileNamed(client, name);
    if (found) return found;
    await sleep(gapMs);

    found = await findFileNamed(client, name);
    if (found) return found;
  }
  return found;
};

test('rescanFolder imports a new file and preserves the row across an inode move', async () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const originalName = `rescan-move-${suffix}-original.txt`;
  const renamedName = `rescan-move-${suffix}-renamed.txt`;
  const originalPath = join(videoFolderPath, originalName);
  const renamedPath = join(videoFolderPath, renamedName);
  // Back-date well past the 10s settle window so the fast path imports on the
  // first pass the file is actually visible, with generous margin against
  // clock skew between the host and a Docker backend container.
  const oldEnoughForFastPath = new Date(Date.now() - 120_000);

  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  await writeFile(originalPath, `rescan move ${suffix}`);
  await utimes(originalPath, oldEnoughForFastPath, oldEnoughForFastPath);

  try {
    const importedFile = await rescanUntilFound(client, originalName);
    expect(importedFile?.id).toBeDefined();

    await rename(originalPath, renamedPath);

    const movedFile = await rescanUntilFound(client, renamedName);
    // Same row (id) survives the inode move, and the old name is gone.
    expect(movedFile?.id).toBe(importedFile?.id);

    const oldFile = await findFileNamed(client, originalName);
    expect(oldFile).toBeUndefined();
  } finally {
    await rm(originalPath, { force: true });
    await rm(renamedPath, { force: true });
    await client
      .mutation(rescanFolderMutation, { folderId: videoFolderId })
      .toPromise();
  }
}, 180_000);
