import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { editUserMutation } from '../shared/urql/mutations/editUserMutation';
import { deleteUserMutation } from '../shared/urql/mutations/deleteUserMutation';
import { generateZipMutation } from '../shared/urql/mutations/generateZipMutation';
import { commentHistoryQuery } from '../shared/urql/queries/commentHistoryQuery';
import { addCommentMutation } from '../shared/urql/mutations/addCommentMutation';
import { viewFolderQuery } from '../shared/urql/queries/viewFolderQuery';
import { accessLogQuery } from '../shared/urql/queries/accessLogQuery';
import { recentUsersQuery } from '../shared/urql/queries/recentUsersQuery';
import { viewUserQuery } from '../shared/urql/queries/viewUserQuery';
import { viewAdminsQuery } from '../shared/urql/queries/viewAdminsQuery';
import { viewBrandingsQuery } from '../shared/urql/queries/viewBrandingsQuery';
import { serverInfoQuery } from '../shared/urql/queries/serverInfoQuery';
import { readAllFoldersQuery } from '../shared/urql/queries/readAllFoldersQuery';
import { editAdminUserMutation } from '../shared/urql/mutations/editAdminUserMutation';
import { renameFolderMutation } from '../shared/urql/mutations/renameFolderMutation';
import { editFolderMutation } from '../shared/urql/mutations/editFolderMutation';
import { editBrandingMutation } from '../shared/urql/mutations/editBrandingMutation';
import { deleteBrandingMutation } from '../shared/urql/mutations/deleteBrandingMutation';
import { generateThumbnailsMutation } from '../shared/urql/mutations/generateThumbnailsMutation';
import { userDeviceQuery } from '../shared/urql/queries/userDeviceQuery';
import { editUserDeviceMutation } from '../shared/urql/mutations/editUserDeviceMutation';
import { viewFileQuery } from '../shared/urql/queries/viewFileQuery';
import { searchQuery } from '../shared/urql/queries/searchQuery';
import { photoFolderId, videoFolderId } from './testVariables';
import { CommentPermissions, LinkMode } from '../graphql-types';

const expectGraphqlError = (result: { error?: unknown }) => {
  expect(result.error).toBeDefined();
};

const expectAuthCode = (
  result: { error?: { graphQLErrors?: Array<{ extensions?: unknown }> } },
  code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'BAD_USER_INPUT',
  reason: string,
) => {
  expectGraphqlError(result);
  const actualCode = (
    result.error?.graphQLErrors?.[0]?.extensions as
      | { code?: string; reason?: string }
      | undefined
  )?.code;
  const actualReason = (
    result.error?.graphQLErrors?.[0]?.extensions as
      | { code?: string; reason?: string }
      | undefined
  )?.reason;
  expect(actualCode).toBe(code);
  expect(actualReason).toBe(reason);
};

const makeSuffix = () => Math.random().toString(36).slice(2, 8);

const createLinkUser = async (overrides: Record<string, unknown>) => {
  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  const result = await adminClient
    .mutation(editUserMutation, overrides)
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(result.data?.editUser?.id).toBeDefined();
  return result.data!.editUser;
};

test('Public link with proof_no_downloads cannot generate zip', async () => {
  const suffix = makeSuffix();
  const user = await createLinkUser({
    folderId: photoFolderId,
    name: 'Security No Download',
    username: `security-no-download-${suffix}@example.com`,
    commentPermissions: CommentPermissions.Read,
    enabled: true,
    uuid: `security-no-download-${suffix}`,
    linkMode: LinkMode.ProofNoDownloads,
  });

  const linkHeaders = await getLinkHeader(user.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);
  const result = await linkClient
    .mutation(generateZipMutation, { folderId: photoFolderId })
    .toPromise();

  expectGraphqlError(result);

  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  await adminClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
});

test('commentPermissions none blocks comment read and write', async () => {
  const suffix = makeSuffix();
  const user = await createLinkUser({
    folderId: photoFolderId,
    name: 'Security Comments None',
    username: `security-comments-${suffix}@example.com`,
    commentPermissions: CommentPermissions.None,
    enabled: true,
    uuid: `security-comments-${suffix}`,
  });

  const linkHeaders = await getLinkHeader(user.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  const commentsResult = await linkClient
    .query(commentHistoryQuery, { folderId: photoFolderId })
    .toPromise();
  expectAuthCode(commentsResult, 'FORBIDDEN', 'COMMENTS_HIDDEN');

  const folderResult = await linkClient
    .query(viewFolderQuery, { folderId: photoFolderId })
    .toPromise();
  expect(folderResult.error).toBeUndefined();
  const fileId = folderResult.data?.folder?.files?.[0]?.id;
  expect(fileId).toBeDefined();

  const addCommentResult = await linkClient
    .mutation(addCommentMutation, { id: fileId, comment: 'Nope' })
    .toPromise();
  expectAuthCode(addCommentResult, 'FORBIDDEN', 'COMMENTS_NOT_ALLOWED');

  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  await adminClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
});

test('Public link cannot search or access files outside its folder', async () => {
  const suffix = makeSuffix();
  const user = await createLinkUser({
    folderId: photoFolderId,
    name: 'Security Search',
    username: `security-search-${suffix}@example.com`,
    commentPermissions: CommentPermissions.Read,
    enabled: true,
    uuid: `security-search-${suffix}`,
  });

  const linkHeaders = await getLinkHeader(user.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  const searchResult = await linkClient
    .query(searchQuery, { folderId: videoFolderId, query: 'Birthday' })
    .toPromise();
  expectAuthCode(searchResult, 'FORBIDDEN', 'INVALID_LINK');

  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  const otherFolder = await adminClient
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(otherFolder.error).toBeUndefined();
  const otherFileId = otherFolder.data?.folder?.files?.[0]?.id;
  expect(otherFileId).toBeDefined();

  const fileResult = await linkClient
    .query(viewFileQuery, { fileId: otherFileId })
    .toPromise();
  expectAuthCode(fileResult, 'FORBIDDEN', 'INVALID_LINK');

  await adminClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
});

test('Admin-only queries are blocked for public links', async () => {
  const suffix = makeSuffix();
  const user = await createLinkUser({
    folderId: photoFolderId,
    name: 'Security Admin Queries',
    username: `security-admin-queries-${suffix}@example.com`,
    commentPermissions: CommentPermissions.Read,
    enabled: true,
    uuid: `security-admin-queries-${suffix}`,
  });

  const linkHeaders = await getLinkHeader(user.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  expectAuthCode(
    await linkClient
      .query(accessLogQuery, { folderId: '1', includeChildren: true })
      .toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.query(recentUsersQuery, { folderId: '1' }).toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.query(viewUserQuery, { id: '1' }).toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.query(viewAdminsQuery, {}).toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.query(viewBrandingsQuery, {}).toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.query(serverInfoQuery, {}).toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.query(readAllFoldersQuery, { id: '1' }).toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );

  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  await adminClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
});

test('Admin-only queries are blocked for unauthenticated requests', async () => {
  const client = await createTestGraphqlClient({});

  expectAuthCode(
    await client
      .query(accessLogQuery, { folderId: '1', includeChildren: true })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.query(recentUsersQuery, { folderId: '1' }).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.query(viewUserQuery, { id: '1' }).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.query(viewAdminsQuery, {}).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.query(viewBrandingsQuery, {}).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.query(serverInfoQuery, {}).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.query(readAllFoldersQuery, { id: '1' }).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
});

test('Admin-only mutations are blocked for public links', async () => {
  const suffix = makeSuffix();
  const user = await createLinkUser({
    folderId: photoFolderId,
    name: 'Security Admin Mutations',
    username: `security-admin-mutations-${suffix}@example.com`,
    commentPermissions: CommentPermissions.Read,
    enabled: true,
    uuid: `security-admin-mutations-${suffix}`,
  });

  const linkHeaders = await getLinkHeader(user.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  expectAuthCode(
    await linkClient
      .mutation(editUserMutation, {
        folderId: photoFolderId,
        name: 'Should Fail',
        username: `should-fail-${suffix}@example.com`,
        commentPermissions: CommentPermissions.Read,
        enabled: true,
        uuid: `should-fail-${suffix}`,
      })
      .toPromise(),
    'FORBIDDEN',
    'ACCESS_DENIED',
  );
  expectAuthCode(
    await linkClient
      .mutation(editAdminUserMutation, { id: '1', folderId: '1', name: 'No' })
      .toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient.mutation(deleteUserMutation, { id: user.id }).toPromise(),
    'FORBIDDEN',
    'ACCESS_DENIED',
  );
  expectAuthCode(
    await linkClient
      .mutation(renameFolderMutation, {
        folderId: photoFolderId,
        oldPath: 'X',
        newPath: 'Y',
      })
      .toPromise(),
    'FORBIDDEN',
    'ACCESS_DENIED',
  );
  expectAuthCode(
    await linkClient
      .mutation(editFolderMutation, {
        folderId: photoFolderId,
        heroImageId: '2',
      })
      .toPromise(),
    'FORBIDDEN',
    'ACCESS_DENIED',
  );
  expectAuthCode(
    await linkClient
      .mutation(editBrandingMutation, { name: 'Should Fail' })
      .toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient
      .mutation(deleteBrandingMutation, { id: '999' })
      .toPromise(),
    'FORBIDDEN',
    'INVALID_LINK',
  );
  expectAuthCode(
    await linkClient
      .mutation(generateThumbnailsMutation, { folderId: photoFolderId })
      .toPromise(),
    'FORBIDDEN',
    'ACCESS_DENIED',
  );

  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  await adminClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
});

test('Admin-only mutations are blocked for unauthenticated requests', async () => {
  const client = await createTestGraphqlClient({});

  expectAuthCode(
    await client
      .mutation(generateZipMutation, { folderId: photoFolderId })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client
      .mutation(editUserMutation, {
        folderId: photoFolderId,
        name: 'No Auth',
        username: `no-auth-${makeSuffix()}@example.com`,
        commentPermissions: CommentPermissions.Read,
        enabled: true,
        uuid: `no-auth-${makeSuffix()}`,
      })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client
      .mutation(editAdminUserMutation, { id: '1', folderId: '1', name: 'No' })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client
      .mutation(renameFolderMutation, {
        folderId: photoFolderId,
        oldPath: 'X',
        newPath: 'Y',
      })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client
      .mutation(editFolderMutation, {
        folderId: photoFolderId,
        heroImageId: '2',
      })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client
      .mutation(editBrandingMutation, { name: 'Should Fail' })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client.mutation(deleteBrandingMutation, { id: '999' }).toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
  expectAuthCode(
    await client
      .mutation(generateThumbnailsMutation, { folderId: photoFolderId })
      .toPromise(),
    'UNAUTHENTICATED',
    'NOT_LOGGED_IN',
  );
});

test('userDevices enforces user isolation', async () => {
  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);

  const token = `security-device-${makeSuffix()}`;
  const editResult = await adminClient
    .mutation(editUserDeviceMutation, {
      token,
      name: 'Security Device',
      userId: '1',
      enabled: true,
    })
    .toPromise();
  expect(editResult.error).toBeUndefined();

  const ownDevices = await adminClient
    .query(userDeviceQuery, { userId: '1', token })
    .toPromise();
  expect(ownDevices.error).toBeUndefined();
  expect(ownDevices.data?.userDevices?.length).toBeGreaterThan(0);

  const otherDevices = await adminClient
    .query(userDeviceQuery, { userId: '2', token })
    .toPromise();
  expectAuthCode(otherDevices, 'FORBIDDEN', 'ACCESS_DENIED');
});

test('Public links cannot read or edit userDevices', async () => {
  const suffix = makeSuffix();
  const user = await createLinkUser({
    folderId: photoFolderId,
    name: 'Security UserDevices Link',
    username: `security-userdevices-${suffix}@example.com`,
    commentPermissions: CommentPermissions.Read,
    enabled: true,
    uuid: `security-userdevices-${suffix}`,
  });

  const linkHeaders = await getLinkHeader(user.uuid);
  const linkClient = await createTestGraphqlClient(linkHeaders);

  expectAuthCode(
    await linkClient
      .query(userDeviceQuery, { userId: '1', token: 'nope' })
      .toPromise(),
    'FORBIDDEN',
    'NOT_A_USER',
  );
  expectAuthCode(
    await linkClient
      .mutation(editUserDeviceMutation, {
        token: 'nope',
        name: 'Nope',
        userId: '1',
        enabled: true,
      })
      .toPromise(),
    'FORBIDDEN',
    'NOT_A_USER',
  );

  const adminHeaders = await getUserHeader(defaultCredentials);
  const adminClient = await createTestGraphqlClient(adminHeaders);
  await adminClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
});
