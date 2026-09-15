import { afterAll, beforeAll, expect, test } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { defaultCredentials } from '../../backend/auth/defaultCredentials.js';
import { extractZip } from '../../backend/helpers/extractZip.js';
import { CommentPermissions, LinkMode } from '../../shared/gql/graphql.js';
import { accessLogQuery } from '../../shared/urql/queries/accessLogQuery.js';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery.js';
import { taskQuery } from '../../shared/urql/queries/taskQuery.js';
import { deleteUserMutation } from '../../shared/urql/mutations/deleteUserMutation.js';
import { editUserMutation } from '../../shared/urql/mutations/editUserMutation.js';
import { generateMediaResultsZipMutation } from '../../shared/urql/mutations/generateMediaResultsZipMutation.js';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from './testGraphqlClient.js';
import { photoFolderId, testUrl } from './testVariables.js';

let linkUserId: string | undefined;
let linkClient: Awaited<ReturnType<typeof createTestGraphqlClient>>;
let adminClient: Awaited<ReturnType<typeof createTestGraphqlClient>>;

beforeAll(async () => {
  adminClient = await createTestGraphqlClient(
    await getUserHeader(defaultCredentials),
  );
  const suffix = Math.random().toString(36).slice(2, 8);
  const uuid = `media-export-${suffix}`;
  const created = await adminClient
    .mutation(editUserMutation, {
      folderId: photoFolderId,
      name: 'Media export link',
      username: `${uuid}@example.com`,
      uuid,
      enabled: true,
      commentPermissions: CommentPermissions.Read,
      linkMode: LinkMode.FinalDelivery,
    })
    .toPromise();
  expect(created.error).toBeUndefined();
  linkUserId = created.data?.editUser.id;
  linkClient = await createTestGraphqlClient({
    ...(await getLinkHeader(uuid)),
    sessionid: `media-export-session-${suffix}`,
    'user-agent': 'PICR media export integration test',
  });
});

afterAll(async () => {
  if (linkUserId) {
    await adminClient
      .mutation(deleteUserMutation, { id: linkUserId })
      .toPromise();
  }
});

const waitForZip = async (taskId: string) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await linkClient
      .query(
        taskQuery,
        { folderId: photoFolderId },
        { requestPolicy: 'network-only' },
      )
      .toPromise();
    const task = response.data?.tasks.find(({ id }) => id === taskId);
    if (task?.status === 'Complete') return;
    if (task?.status === 'Error')
      throw new Error('Filtered ZIP generation failed');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for filtered ZIP generation');
};

test('a public link downloads exactly its canonical filtered selection', async () => {
  const folder = await linkClient
    .query(viewFolderQuery, { folderId: photoFolderId })
    .toPromise();
  const selectedName = folder.data?.folder.files[0]?.name;
  expect(selectedName).toBeDefined();
  if (!selectedName) return;

  const generated = await linkClient
    .mutation(generateMediaResultsZipMutation, {
      input: { folderId: photoFolderId, query: selectedName },
    })
    .toPromise();
  expect(generated.error).toBeUndefined();
  const artifact = generated.data?.generateMediaResultsZip;
  expect(artifact?.count).toBe(1);
  if (!artifact) return;

  await waitForZip(`${photoFolderId}${artifact.token}`);
  const response = await fetch(
    `${testUrl}zip/${photoFolderId}/${artifact.token}/${artifact.filename}`,
  );
  expect(response.status).toBe(200);

  const temporary = await mkdtemp(path.join(tmpdir(), 'picr-filtered-zip-'));
  try {
    const zipPath = path.join(temporary, 'selection.zip');
    const extractedPath = path.join(temporary, 'extracted');
    await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
    await extractZip(zipPath, extractedPath);
    const entries = await readdir(extractedPath, { recursive: true });
    const files = [];
    for (const entry of entries) {
      const candidate = path.join(extractedPath, entry);
      try {
        await readFile(candidate);
        files.push(entry);
      } catch {
        // Directories are expected while walking a recursive archive.
      }
    }
    expect(files).toEqual([selectedName]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }

  const access = await adminClient
    .query(accessLogQuery, {
      folderId: photoFolderId,
      userId: linkUserId,
      includeChildren: true,
    })
    .toPromise();
  expect(access.error).toBeUndefined();
  expect(
    access.data?.accessLogs.filter(({ type }) => type === 'Download'),
  ).toHaveLength(1);
});
