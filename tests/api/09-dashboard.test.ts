import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { addCommentMutation } from '../../shared/urql/mutations/addCommentMutation';
import { dashboardCommentsQuery } from '../../shared/urql/queries/dashboardCommentsQuery';
import { dashboardStatsQuery } from '../../shared/urql/queries/dashboardStatsQuery';
import { dashboardUpdateInfoQuery } from '../../shared/urql/queries/dashboardUpdateInfoQuery';
import { dashboardGalleriesQuery } from '../../shared/urql/queries/dashboardGalleriesQuery';
import { readAllFoldersQuery } from '../../shared/urql/queries/readAllFoldersQuery';
import { recentUsersQuery } from '../../shared/urql/queries/recentUsersQuery';
import { accessLogQuery } from '../../shared/urql/queries/accessLogQuery';
import { editAdminUserMutation } from '../../shared/urql/mutations/editAdminUserMutation';
import { deleteUserMutation } from '../../shared/urql/mutations/deleteUserMutation';
import { editUserMutation } from '../../shared/urql/mutations/editUserMutation';
import { recordFolderVisitMutation } from '../../shared/urql/mutations/recordFolderVisitMutation';
import { photoFolderId } from './testVariables';
import { AccessType, CommentPermissions } from '../../shared/gql/graphql';

const makeSuffix = () => Math.random().toString(36).slice(2, 8);

const expectAuthCode = (
  result: { error?: { graphQLErrors?: Array<{ extensions?: unknown }> } },
  code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'BAD_USER_INPUT',
  reason?: string,
) => {
  expect(result.error).toBeDefined();
  const extensions = result.error?.graphQLErrors?.[0]?.extensions as
    | { code?: string; reason?: string }
    | undefined;
  expect(extensions?.code).toBe(code);
  if (reason) expect(extensions?.reason).toBe(reason);
};

// Covers the dashboard "Client Feedback" data path: the comments query with
// includeChildren (subtree) + limit added for the dashboard redesign.
test('Dashboard comments query returns subtree comments with the file attached', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  // Comment on a file inside a sub-folder (photoFolderId is under root '1').
  const folder = await client
    .query(viewFolderQuery, { folderId: photoFolderId })
    .toPromise();
  const file = folder.data!.folder.files[0];
  expect(file?.id).toBeTruthy();

  const uniqueText = `dashboard-${Math.random().toString(36).slice(2, 8)}`;
  const added = await client
    .mutation(addCommentMutation, { id: file.id, comment: uniqueText })
    .toPromise();
  expect(added.error).toBeUndefined();

  // Query from the ROOT folder with includeChildren — the sub-folder comment
  // should surface, proving subtree support.
  const result = await client
    .query(dashboardCommentsQuery, { id: '1', limit: 25 })
    .toPromise();
  expect(result.error).toBeUndefined();

  const comments = result.data!.comments;
  expect(comments.length).toBeLessThanOrEqual(25);

  const mine = comments.find((c) => c.comment === uniqueText);
  expect(mine).toBeDefined();
  expect(mine?.file?.id).toBe(file.id);

  // Comment.file must expose FileInterface, not the concrete `File` type, so a
  // comment's file reports the same runtime type as the folder query does. When
  // it was typed as `File` this was always 'File', the `... on Image` half of
  // FileFragment never matched, and the frontend normalized the same row into
  // two cache entities. Asserting `id` alone does not catch that regression.
  expect(file.__typename).toBe('Image');
  expect(mine?.file?.__typename).toBe(file.__typename);
});

test('Dashboard comments query respects the limit argument', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .query(dashboardCommentsQuery, { id: '1', limit: 1 })
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(result.data!.comments.length).toBeLessThanOrEqual(1);
});

test('Dashboard comments query rejects invalid limits and caps large limits', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  expectAuthCode(
    await client
      .query(dashboardCommentsQuery, { id: '1', limit: 0 })
      .toPromise(),
    'BAD_USER_INPUT',
  );

  const largeLimit = await client
    .query(dashboardCommentsQuery, { id: '1', limit: 1000 })
    .toPromise();
  expect(largeLimit.error).toBeUndefined();
  expect(largeLimit.data!.comments.length).toBeLessThanOrEqual(100);
});

test('Dashboard queries work for a sub-folder scoped admin', async () => {
  const rootHeaders = await getUserHeader(defaultCredentials);
  const rootClient = await createTestGraphqlClient(rootHeaders);
  const suffix = makeSuffix();
  const username = `dashboard-scoped-${suffix}@example.com`;
  const password = 'dashboardpass123';

  const created = await rootClient
    .mutation(editAdminUserMutation, {
      folderId: photoFolderId,
      name: 'Dashboard Scoped Admin',
      username,
      password,
      enabled: true,
    })
    .toPromise();
  expect(created.error).toBeUndefined();
  const adminId = created.data!.editAdminUser.id;

  try {
    const scopedHeaders = await getUserHeader({ username, password });
    const scopedClient = await createTestGraphqlClient(scopedHeaders);

    const stats = await scopedClient
      .query(dashboardStatsQuery, { folderId: photoFolderId })
      .toPromise();
    expect(stats.error).toBeUndefined();
    expect(stats.data!.dashboardStats.totalFiles).toBeGreaterThan(0);

    const outsideStats = await scopedClient
      .query(dashboardStatsQuery, { folderId: '1' })
      .toPromise();
    expectAuthCode(outsideStats, 'FORBIDDEN', 'ACCESS_DENIED');

    const updateInfo = await scopedClient
      .query(dashboardUpdateInfoQuery, {})
      .toPromise();
    expect(updateInfo.error).toBeUndefined();
    expect(updateInfo.data!.dashboardUpdateInfo.version).toBeTruthy();

    const galleries = await scopedClient
      .query(dashboardGalleriesQuery, { id: photoFolderId })
      .toPromise();
    expect(galleries.error).toBeUndefined();

    const modified = await scopedClient
      .query(readAllFoldersQuery, { id: photoFolderId })
      .toPromise();
    expect(modified.error).toBeUndefined();

    const clients = await scopedClient
      .query(recentUsersQuery, { folderId: photoFolderId })
      .toPromise();
    expect(clients.error).toBeUndefined();

    const comments = await scopedClient
      .query(dashboardCommentsQuery, { id: photoFolderId, limit: 25 })
      .toPromise();
    expect(comments.error).toBeUndefined();
  } finally {
    if (adminId) {
      await rootClient
        .mutation(deleteUserMutation, { id: adminId })
        .toPromise();
    }
  }
});

test('Public link real visits update dashboard recent client timestamp', async () => {
  const rootHeaders = await getUserHeader(defaultCredentials);
  const rootClient = await createTestGraphqlClient(rootHeaders);
  const suffix = makeSuffix();
  const linkUser = await rootClient
    .mutation(editUserMutation, {
      folderId: photoFolderId,
      name: 'Dashboard Visit Link User',
      username: `dashboard-visit-${suffix}@example.com`,
      commentPermissions: CommentPermissions.Read,
      enabled: true,
      uuid: `dashboard-visit-${suffix}`,
    })
    .toPromise();
  expect(linkUser.error).toBeUndefined();

  const user = linkUser.data!.editUser;

  try {
    const userAgent = `dashboard-visit/${suffix}`;
    const linkHeaders = {
      ...(await getLinkHeader(user.uuid!)),
      sessionid: `dashboard-visit-${suffix}`,
      'user-agent': userAgent,
    };
    const linkClient = await createTestGraphqlClient(linkHeaders);

    const before = await rootClient
      .query(recentUsersQuery, { folderId: photoFolderId })
      .toPromise();
    expect(before.error).toBeUndefined();
    expect(before.data!.users.some((u) => u.id === user.id)).toBe(false);

    const viewed = await linkClient
      .query(viewFolderQuery, { folderId: photoFolderId })
      .toPromise();
    expect(viewed.error).toBeUndefined();

    const afterFolderView = await rootClient
      .query(recentUsersQuery, { folderId: photoFolderId })
      .toPromise();
    expect(afterFolderView.error).toBeUndefined();
    expect(afterFolderView.data!.users.some((u) => u.id === user.id)).toBe(
      false,
    );

    const logs = await rootClient
      .query(accessLogQuery, { folderId: photoFolderId, userId: user.id })
      .toPromise();
    expect(logs.error).toBeUndefined();
    expect(
      logs.data!.accessLogs.some(
        (log) =>
          log.type === AccessType.View &&
          log.userId === user.id &&
          log.userAgent === userAgent,
      ),
    ).toBe(true);

    const visit = await linkClient
      .mutation(recordFolderVisitMutation, { folderId: photoFolderId })
      .toPromise();
    expect(visit.error).toBeUndefined();
    expect(visit.data?.recordFolderVisit).toBe(true);

    const after = await rootClient
      .query(recentUsersQuery, { folderId: photoFolderId })
      .toPromise();
    expect(after.error).toBeUndefined();

    const recentUser = after.data!.users.find((u) => u.id === user.id);
    expect(recentUser?.lastAccess).toBeDefined();

    const duplicateVisit = await linkClient
      .mutation(recordFolderVisitMutation, { folderId: photoFolderId })
      .toPromise();
    expect(duplicateVisit.error).toBeUndefined();
    expect(duplicateVisit.data?.recordFolderVisit).toBe(false);
  } finally {
    await rootClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
  }
});

test('Hidden public link folder requests do not write access log rows', async () => {
  const rootHeaders = await getUserHeader(defaultCredentials);
  const rootClient = await createTestGraphqlClient(rootHeaders);
  const suffix = makeSuffix();
  const linkUser = await rootClient
    .mutation(editUserMutation, {
      folderId: photoFolderId,
      name: 'Dashboard Hidden Link User',
      username: `dashboard-hidden-${suffix}@example.com`,
      commentPermissions: CommentPermissions.Read,
      enabled: true,
      uuid: `dashboard-hidden-${suffix}`,
    })
    .toPromise();
  expect(linkUser.error).toBeUndefined();

  const user = linkUser.data!.editUser;

  try {
    const userAgent = `dashboard-hidden/${suffix}`;
    const hiddenClient = await createTestGraphqlClient({
      ...(await getLinkHeader(user.uuid!)),
      sessionid: `dashboard-hidden-${suffix}`,
      'user-agent': userAgent,
      visibility: 'hidden',
    });

    const viewed = await hiddenClient
      .query(viewFolderQuery, { folderId: photoFolderId })
      .toPromise();
    expect(viewed.error).toBeUndefined();

    const logs = await rootClient
      .query(accessLogQuery, { folderId: photoFolderId, userId: user.id })
      .toPromise();
    expect(logs.error).toBeUndefined();
    expect(
      logs.data!.accessLogs.some((log) => log.userAgent === userAgent),
    ).toBe(false);
  } finally {
    await rootClient.mutation(deleteUserMutation, { id: user.id }).toPromise();
  }
});

test('Dashboard admin-only queries block public links and unauthenticated users', async () => {
  const rootHeaders = await getUserHeader(defaultCredentials);
  const rootClient = await createTestGraphqlClient(rootHeaders);
  const suffix = makeSuffix();
  const linkUser = await rootClient
    .mutation(editUserMutation, {
      folderId: photoFolderId,
      name: 'Dashboard Link User',
      username: `dashboard-link-${suffix}@example.com`,
      commentPermissions: CommentPermissions.Read,
      enabled: true,
      uuid: `dashboard-link-${suffix}`,
    })
    .toPromise();
  expect(linkUser.error).toBeUndefined();

  try {
    const linkClient = await createTestGraphqlClient(
      await getLinkHeader(linkUser.data!.editUser.uuid!),
    );
    expectAuthCode(
      await linkClient
        .query(dashboardStatsQuery, { folderId: photoFolderId })
        .toPromise(),
      'FORBIDDEN',
      'ACCESS_DENIED',
    );
    expectAuthCode(
      await linkClient.query(dashboardUpdateInfoQuery, {}).toPromise(),
      'FORBIDDEN',
      'INVALID_LINK',
    );

    const unauthenticatedClient = await createTestGraphqlClient({});
    expectAuthCode(
      await unauthenticatedClient
        .query(dashboardStatsQuery, { folderId: photoFolderId })
        .toPromise(),
      'UNAUTHENTICATED',
      'NOT_LOGGED_IN',
    );
    expectAuthCode(
      await unauthenticatedClient
        .query(dashboardUpdateInfoQuery, {})
        .toPromise(),
      'UNAUTHENTICATED',
      'NOT_LOGGED_IN',
    );
  } finally {
    await rootClient
      .mutation(deleteUserMutation, { id: linkUser.data!.editUser.id })
      .toPromise();
  }
});
