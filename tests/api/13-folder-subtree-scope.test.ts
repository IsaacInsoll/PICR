import { expect, test } from 'vitest';
import { join } from 'node:path';
import { mkdir, rm, utimes, writeFile } from 'node:fs/promises';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { rescanFolderMutation } from '../../shared/urql/mutations/rescanFolderMutation';
import { editUserMutation } from '../../shared/urql/mutations/editUserMutation';
import { deleteUserMutation } from '../../shared/urql/mutations/deleteUserMutation';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { searchQuery } from '../../shared/urql/queries/searchQuery';
import { folderFilesQuery } from '../../shared/urql/queries/folderFilesQuery';
import { CommentPermissions } from '../../shared/gql/graphql';
import { videoFolderId } from './testVariables';

const videoFolderPath = join(
  process.cwd(),
  'tests/api/env/media/Birthday Video',
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type TestClient = Awaited<ReturnType<typeof createTestGraphqlClient>>;

const subFolderIdNamed = async (client: TestClient, name: string) => {
  const result = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(result.error).toBeUndefined();
  return result.data?.folder?.subFolders.find((folder) => folder.name === name)
    ?.id;
};

// Same rationale as 10-rescan-folder: the scanner's settle window and Docker
// bind mounts can hide freshly written files from the first scan, so rescan
// until both fixture trees are imported rather than asserting on one pass.
const rescanUntilFolders = async (
  client: TestClient,
  names: string[],
  attempts = 12,
  gapMs = 1500,
) => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const rescan = await client
      .mutation(rescanFolderMutation, { folderId: videoFolderId })
      .toPromise();
    expect(rescan.error).toBeUndefined();

    const ids = await Promise.all(
      names.map((name) => subFolderIdNamed(client, name)),
    );
    if (ids.every(Boolean)) return ids as string[];
    await sleep(gapMs);
  }
  return undefined;
};

const writeBackdatedFixture = async (
  folderPath: string,
  innerName: string,
  fileName: string,
) => {
  const innerPath = join(folderPath, innerName);
  const filePath = join(innerPath, fileName);
  // Back-date past the scanner's settle window (see 10-rescan-folder).
  const oldEnoughForFastPath = new Date(Date.now() - 120_000);

  await mkdir(innerPath, { recursive: true });
  await writeFile(filePath, `subtree scope fixture ${fileName}`);
  await utimes(filePath, oldEnoughForFastPath, oldEnoughForFastPath);
  await utimes(innerPath, oldEnoughForFastPath, oldEnoughForFastPath);
  await utimes(folderPath, oldEnoughForFastPath, oldEnoughForFastPath);
};

// SQL LIKE treats `_` as a single-character wildcard. A subtree rooted at
// `scope_<id>` must not also include the sibling `scopeX<id>`, whose path the
// unescaped prefix pattern `.../scope_<id>/%` would otherwise match.
//
// Skipped under `act` for the same bind-mount visibility reason documented in
// 10-rescan-folder; native CI runs it strictly.
test.skipIf(!!process.env.ACT)(
  'folder subtree queries treat LIKE wildcards in folder names literally',
  async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const scopedName = `scope_${suffix}`;
    const siblingName = `scopeX${suffix}`;
    const innerName = `inner-${suffix}`;
    const insideFile = `inside-${suffix}.txt`;
    const outsideFile = `outside-${suffix}.txt`;
    const linkUuid = `subtree-scope-${suffix}`;

    const adminClient = await createTestGraphqlClient(
      await getUserHeader(defaultCredentials),
    );
    const scopedPath = join(videoFolderPath, scopedName);
    const siblingPath = join(videoFolderPath, siblingName);
    let linkUserId: string | undefined;

    try {
      await writeBackdatedFixture(scopedPath, innerName, insideFile);
      await writeBackdatedFixture(siblingPath, innerName, outsideFile);

      const folderIds = await rescanUntilFolders(adminClient, [
        scopedName,
        siblingName,
      ]);
      expect(folderIds).toBeDefined();
      const [scopedFolderId] = folderIds!;

      // Sanity check: both files are indexed and visible from their common
      // parent, so the assertions below cannot pass merely because the
      // sibling fixture was never imported.
      const parentSearch = await adminClient
        .query(searchQuery, { folderId: videoFolderId, query: suffix })
        .toPromise();
      expect(parentSearch.error).toBeUndefined();
      expect(
        parentSearch.data?.searchFiles.map((file) => file.name).sort(),
      ).toEqual([insideFile, outsideFile]);

      const link = await adminClient
        .mutation(editUserMutation, {
          folderId: scopedFolderId,
          name: 'Subtree Scope Link',
          username: `subtree-scope-${suffix}@example.com`,
          commentPermissions: CommentPermissions.None,
          enabled: true,
          uuid: linkUuid,
        })
        .toPromise();
      expect(link.error).toBeUndefined();
      linkUserId = link.data?.editUser.id;
      expect(linkUserId).toBeDefined();

      const linkClient = await createTestGraphqlClient(
        await getLinkHeader(linkUuid),
      );

      const linkSearch = await linkClient
        .query(searchQuery, { folderId: scopedFolderId, query: suffix })
        .toPromise();
      expect(linkSearch.error).toBeUndefined();
      expect(linkSearch.data?.searchFiles.map((file) => file.name)).toEqual([
        insideFile,
      ]);

      const linkFiles = await linkClient
        .query(folderFilesQuery, {
          folderId: scopedFolderId,
          includeSubfolders: true,
        })
        .toPromise();
      expect(linkFiles.error).toBeUndefined();
      expect(
        linkFiles.data?.folderFiles.files.map((item) => item.file.name),
      ).toEqual([insideFile]);
      expect(linkFiles.data?.folderFiles.totalAvailable).toBe(1);
    } finally {
      // Best-effort cleanup without assertions, so a cleanup problem cannot
      // replace the original test failure.
      if (linkUserId) {
        await adminClient
          .mutation(deleteUserMutation, { id: linkUserId })
          .toPromise();
      }
      await rm(scopedPath, { recursive: true, force: true });
      await rm(siblingPath, { recursive: true, force: true });
      await adminClient
        .mutation(rescanFolderMutation, { folderId: videoFolderId })
        .toPromise();
    }
  },
  120_000,
);
