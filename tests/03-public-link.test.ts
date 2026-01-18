import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { editUserMutation } from '../shared/urql/mutations/editUserMutation';

import {
  gravatarTest,
  photoFolderId,
  testPublicLink,
  testUrl,
  videoFolderId,
} from './testVariables';
import { viewFolderQuery } from '../shared/urql/queries/viewFolderQuery';
import { LinkMode } from '../graphql-types';

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
    ntfyEmail: false,
    linkMode: LinkMode.FinalDelivery,
  });

  const folder = user.folder;
  expect(folder?.id).toBe(photoFolderId);
  expect(folder?.parents).toHaveLength(1);
  expect(folder?.parents[0].id).toBe('1');
});

test('Querying folder without UUID / Authorisation should fail', async () => {
  const client = await createTestGraphqlClient({});
  const result = await client
    .query(viewFolderQuery, { folderId: testPublicLink.folderId })
    .toPromise();

  expect(result.error).toBeDefined();
  expect(result.data?.folder).toBeUndefined();
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
    .query(viewFolderQuery, { folderId: '1' })
    .toPromise();
  expect(homeResult.error).toBeDefined();
  expect(homeResult.data?.folder).toBeUndefined();

  const otherResult = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(otherResult.error).toBeDefined();
  expect(otherResult.data?.folder).toBeUndefined();
});

test('Open Graph: social media friendly links', async () => {
  const url = testUrl + `s/${testPublicLink.uuid}/${testPublicLink.folderId}`; // defined in useBaseViewFolderURL.ts
  const response = await fetch(url);
  const text = await response.text();
  expect(text).toContain('<title>Dog Photos » PICR</title>');
  expect(text).toContain('<div id="root"></div>');

  expect(text).toContain(
    '<meta property="og:title" content="Dog Photos » PICR" />',
  );

  expect(text).toContain('<meta property="og:type" content="website" />');
  expect(text).toContain(
    '<meta property="og:description" content="10 Images" />',
  );

  // expect some http/https URL ending with a slash
  expect(text).toMatch(
    /<meta property="og:url" content="https?:\/\/(.){5,}\/(.){5,}" \/>/gm,
  );

  // the hash changes so lets accept any 64 characters :)
  expect(text).toMatch(
    /<meta property="og:image" content="https?:\/\/(.){5,}\/image\/2\/md\/(.){64}\/XH2A2139.jpg" \/>/gm,
  ); //TODO: full URL
});

//TODO: can view comments
//TODO: can't add comment
