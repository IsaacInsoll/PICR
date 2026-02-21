import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from '../../frontend/testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { editUserMutation } from '../../shared/urql/mutations/editUserMutation';
import { deleteUserMutation } from '../../shared/urql/mutations/deleteUserMutation';
import { accessLogQuery } from '../../shared/urql/queries/accessLogQuery';

import { photoFolderId, videoFolderId } from './testVariables';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { CommentPermissions, LinkMode } from '../../graphql-types';

// Generate unique suffix for this test run to avoid conflicts
const testSuffix = Math.random().toString(36).slice(2, 8);

const testPublicLink = {
  folderId: photoFolderId,
  name: 'Public Test User',
  username: `test-public-${testSuffix}@example.com`,
  commentPermissions: CommentPermissions.Read,
  enabled: true,
  uuid: `public-test-user-${testSuffix}`,
};

// Store the created user ID for use across tests
let createdUserId: string;

test('Create Public Link', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .mutation(editUserMutation, testPublicLink)
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.editUser).toBeDefined();

  const user = result.data!.editUser;
  createdUserId = user.id;

  // Verify expected properties (excluding dynamic id)
  expect(user.name).toBe(testPublicLink.name);
  expect(user.username).toBe(testPublicLink.username);
  expect(user.folderId).toBe(testPublicLink.folderId);
  expect(user.commentPermissions).toBe(testPublicLink.commentPermissions);
  expect(user.enabled).toBe(testPublicLink.enabled);
  expect(user.linkMode).toBe(LinkMode.FinalDelivery);
  expect(user.gravatar).toContain('gravatar.com/avatar/');

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
  const testUrl = 'http://localhost:6901/';
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

test('Admin can see access log entry for public link visit', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .query(accessLogQuery, { folderId: '1', includeChildren: true })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.accessLogs).toBeDefined();

  // Find an access log entry for our test user
  const logs = result.data!.accessLogs;
  const testUserLogs = logs.filter((log) => log.userId === createdUserId);
  expect(testUserLogs.length).toBeGreaterThan(0);

  // Verify the log entry has expected properties
  const log = testUserLogs[0];
  expect(log.folderId).toBe(photoFolderId);
  expect(log.timestamp).toBeDefined();
});

test('Disabled public link cannot access folder', async () => {
  // Admin disables the link
  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);

  const disableResult = await adminClient
    .mutation(editUserMutation, {
      ...testPublicLink,
      id: createdUserId,
      enabled: false,
    })
    .toPromise();

  expect(disableResult.error).toBeUndefined();
  expect(disableResult.data?.editUser?.enabled).toBe(false);

  // Now try to access with the disabled link
  const linkHeaders = await getLinkHeader(testPublicLink.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  const result = await linkClient
    .query(viewFolderQuery, { folderId: testPublicLink.folderId })
    .toPromise();

  expect(result.error).toBeDefined();
  expect(result.data?.folder).toBeUndefined();
});

test('Re-enabled link works, then deleted link fails', async () => {
  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);

  // Re-enable the link
  const enableResult = await adminClient
    .mutation(editUserMutation, {
      ...testPublicLink,
      id: createdUserId,
      enabled: true,
    })
    .toPromise();

  expect(enableResult.error).toBeUndefined();
  expect(enableResult.data?.editUser?.enabled).toBe(true);

  // Verify it works again
  const linkHeaders = await getLinkHeader(testPublicLink.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  const workingResult = await linkClient
    .query(viewFolderQuery, { folderId: testPublicLink.folderId })
    .toPromise();

  expect(workingResult.error).toBeUndefined();
  expect(workingResult.data?.folder).toBeDefined();

  // Now delete the user
  const deleteResult = await adminClient
    .mutation(deleteUserMutation, { id: createdUserId })
    .toPromise();

  expect(deleteResult.error).toBeUndefined();
  expect(deleteResult.data?.deleteUser).toBe(true);

  // Deleted link should no longer work
  const deletedResult = await linkClient
    .query(viewFolderQuery, { folderId: testPublicLink.folderId })
    .toPromise();

  expect(deletedResult.error).toBeDefined();
  expect(deletedResult.data?.folder).toBeUndefined();
});

test('Access logs no longer show deleted user', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .query(accessLogQuery, { folderId: '1', includeChildren: true })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.accessLogs).toBeDefined();

  // Deleted user should not appear in access logs
  const logs = result.data!.accessLogs;
  const deletedUserLogs = logs.filter((log) => log.userId === createdUserId);
  expect(deletedUserLogs.length).toBe(0);
});

//TODO: can view comments
//TODO: can't add comment
