import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { editUserMutation } from '../frontend/src/urql/mutations/editUserMutation';

import {
  gravatarTest,
  photoFolderId,
  testPublicLink,
  videoFolderId,
} from './testVariables';
import { viewFolderQuery } from '../frontend/src/urql/queries/viewFolderQuery';

test('Create Public Link', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .mutation(editUserMutation, testPublicLink)
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.editUser).toBeDefined();

  const user = result.data!.editUser;
  //exclude folder prop, test it separately
  expect({ ...user, folder: undefined }).toEqual({
    ...testPublicLink,
    id: '2',
    gravatar: gravatarTest.result,
    folder: undefined,
    ntfy: null,
  });

  const folder = user.folder;
  expect(folder?.id).toBe(photoFolderId);
  expect(folder?.parents).toHaveLength(1);
  expect(folder?.parents[0].id).toBe('1');
});

test('Public Link can access folder', async () => {
  const headers = await getLinkHeader(testPublicLink.uuid);
  const client = await createTestGraphqlClient(headers);
  const result = await client
    .query(viewFolderQuery, { folderId: testPublicLink.folderId })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.folder).toBeDefined();
  const folder = result.data!.folder;
  console.log(folder);

  expect(folder.id).toBe(testPublicLink.folderId);
  // expect(folder.name).toBe('Home');
  expect(folder.parentId).toBe('1');
  expect(folder.parents).toHaveLength(0);
  expect(folder.permissions).toBe('View');

  // straight copy-pasta (same result values) as 02-view test (as admin)
  expect(folder.branding).toBeDefined();
  expect(folder.branding?.mode).toBe('auto');
  expect(folder.branding?.primaryColor).toBe('blue');

  expect(folder.heroImage).toBeDefined();
  expect(folder.heroImage?.id).toBe('2');
  expect(folder.heroImage?.name.endsWith('.jpg')).toBe(true);
  expect(folder.heroImage?.fileHash).toHaveLength(64);
  expect(folder.heroImage?.blurHash.length).toBeGreaterThan(20);
  expect(folder.heroImage?.blurHash.length).toBeLessThan(50);
  // end copy pasta

  expect(folder.subFolders).toHaveLength(0);
  expect(folder.files.length).toBe(10);
});
test("Public Link can't access other folders", async () => {
  const headers = await getLinkHeader(testPublicLink.uuid);
  const client = await createTestGraphqlClient(headers);

  const homeResult = await client
    .query(viewFolderQuery, { folderId: 1 })
    .toPromise();
  expect(homeResult.error).toBeDefined();
  expect(homeResult.data?.folder).toBeUndefined();

  const otherResult = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(otherResult.error).toBeDefined();
  expect(otherResult.data?.folder).toBeUndefined();
});

//TODO: can view comments
//TODO: can't add comment
