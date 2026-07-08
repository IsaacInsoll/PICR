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

test('rescanFolder imports a new file and preserves the row across an inode move', async () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const originalName = `rescan-move-${suffix}-original.txt`;
  const renamedName = `rescan-move-${suffix}-renamed.txt`;
  const originalPath = join(videoFolderPath, originalName);
  const renamedPath = join(videoFolderPath, renamedName);
  const oldEnoughForFastPath = new Date(Date.now() - 15_000);

  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  await writeFile(originalPath, `rescan move ${suffix}`);
  await utimes(originalPath, oldEnoughForFastPath, oldEnoughForFastPath);

  try {
    const importResult = await client
      .mutation(rescanFolderMutation, { folderId: videoFolderId })
      .toPromise();
    expect(importResult.error).toBeUndefined();
    expect(importResult.data?.rescanFolder).toBe(true);

    const afterImport = await client
      .query(viewFolderQuery, { folderId: videoFolderId })
      .toPromise();
    expect(afterImport.error).toBeUndefined();
    const importedFile = afterImport.data?.folder?.files.find(
      (file) => file.name === originalName,
    );
    expect(importedFile?.id).toBeDefined();

    await rename(originalPath, renamedPath);

    const moveResult = await client
      .mutation(rescanFolderMutation, { folderId: videoFolderId })
      .toPromise();
    expect(moveResult.error).toBeUndefined();
    expect(moveResult.data?.rescanFolder).toBe(true);

    const afterMove = await client
      .query(viewFolderQuery, { folderId: videoFolderId })
      .toPromise();
    expect(afterMove.error).toBeUndefined();
    const movedFile = afterMove.data?.folder?.files.find(
      (file) => file.name === renamedName,
    );
    const oldFile = afterMove.data?.folder?.files.find(
      (file) => file.name === originalName,
    );
    expect(movedFile?.id).toBe(importedFile?.id);
    expect(oldFile).toBeUndefined();
  } finally {
    await rm(originalPath, { force: true });
    await rm(renamedPath, { force: true });
    await client
      .mutation(rescanFolderMutation, { folderId: videoFolderId })
      .toPromise();
  }
});
