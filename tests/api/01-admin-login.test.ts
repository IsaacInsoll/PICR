import { expect, test } from 'vitest';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { loginMutation } from '../../shared/urql/mutations/loginMutation';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { meQuery } from '../../shared/urql/queries/meQuery';
import { serverInfoQuery } from '../../shared/urql/queries/serverInfoQuery';
import { gte } from 'semver';
import { DEFAULT_SERVER_MEDIA_SETTINGS } from '../../shared/serverMediaSettings';
import { editServerSettingsMutation } from '../../shared/urql/mutations/editServerSettingsMutation';

test('Login Mutation Works', async () => {
  const client = await createTestGraphqlClient({});
  const result = await client
    .mutation(loginMutation, defaultCredentials)
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(result.data?.auth).toBeDefined();
  const auth = result.data?.auth;
  expect(auth).not.toBe('');
  expect(auth?.startsWith('ey')).toBe(true); //valid JWT starts with `ey`
});

test('Incorrect Login Fails', async () => {
  const badLogin = { ...defaultCredentials, password: 'incorrectPassword' };
  const client = await createTestGraphqlClient({});
  const result = await client.mutation(loginMutation, badLogin).toPromise();

  expect(result.error).toBeUndefined();
  expect(result?.data?.auth).toBeDefined();
  expect(result?.data?.auth).toBe('');
});

test('Login is temporarily rate limited after repeated failures from same IP', async () => {
  const ipA = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  const ipB = `203.0.114.${Math.floor(Math.random() * 200) + 1}`;
  const badLogin = { ...defaultCredentials, password: 'incorrectPassword' };

  const blockedClient = await createTestGraphqlClient({
    'x-forwarded-for': ipA,
  });

  for (let i = 0; i < 5; i++) {
    const failResult = await blockedClient
      .mutation(loginMutation, badLogin)
      .toPromise();
    expect(failResult.error).toBeUndefined();
    expect(failResult.data?.auth).toBe('');
  }

  const blockedValidResult = await blockedClient
    .mutation(loginMutation, defaultCredentials)
    .toPromise();
  expect(blockedValidResult.error).toBeUndefined();
  expect(blockedValidResult.data?.auth).toBe('');

  const differentIpClient = await createTestGraphqlClient({
    'x-forwarded-for': ipB,
  });
  const allowedResult = await differentIpClient
    .mutation(loginMutation, defaultCredentials)
    .toPromise();
  expect(allowedResult.error).toBeUndefined();
  expect(allowedResult.data?.auth).toBeDefined();
  expect(allowedResult.data?.auth.startsWith('ey')).toBe(true);
});

test('Admin has correct user config', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client.query(meQuery, {}).toPromise();
  // console.log(result);
  expect(result.error).toBeUndefined();
  expect(result.data?.me).toBeDefined();

  const { me } = result.data!;
  expect(me?.id).toEqual('1');
  expect(me?.commentPermissions).toEqual('edit');
  // toMatchObject, not toStrictEqual: me.folder selects MinimumFolderFragment, so
  // its exact shape follows that fragment. Pinning the whole object here would
  // fail every time the shared fragment gains a field.
  expect(me?.folder).toMatchObject({ id: '1', name: 'Home' });
});

test('Server Info Query (kinda slow)', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client.query(serverInfoQuery, {}).toPromise();
  // console.log(result);
  expect(result.error).toBeUndefined();
  expect(result.data?.serverInfo).toBeDefined();

  const info = result.data?.serverInfo;
  expect(info?.version).toBeDefined(); // this is built when a `release` is done so might be `DEV` if you haven't done a release locally
  expect(info?.latest).toBeDefined();
  expect(info?.dev).toBeFalsy();
  expect(['enabled', 'disabled', 'unknown']).toContain(
    info?.inodeSupport.status,
  );
  expect(info?.inodeSupport.reason).toBeTruthy();
  expect(['native', 'polling', 'off']).toContain(
    info?.scanning.fileWatcherMode,
  );
  expect(['off', 'direct', 'direct_and_new', 'one_level']).toContain(
    info?.scanning.onViewScanMode,
  );
  expect(info?.settings).toMatchObject({
    ...DEFAULT_SERVER_MEDIA_SETTINGS,
    thumbnailDimensions: {
      sm: DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailSmallPx,
      md: DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailMediumPx,
      lg: DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailLargePx,
    },
  });
  expect(info?.scanning.scheduledScanHours).toBeGreaterThanOrEqual(0);
  expect(info?.scanning.scheduledScan.running).toBe(false);
  expect(info?.scanning.ping.enabled).toBe(true);
  expect(info?.scanning.ping.coordinator.state).toMatch(
    /^(idle|settling|cleanup|degraded)$/,
  );
  expect(info?.scanning.ping.sources).toEqual(expect.any(Array));
  // `latest` comes from an unauthenticated GitHub API call which can be rate-limited in CI;
  // the resolver swallows failures and returns ''. Don't fail the suite on that — just warn.
  if (info!.latest === '') {
    console.warn(
      'serverInfo.latest was empty — GitHub releases API likely failed or was rate-limited; skipping semver check',
    );
  } else {
    expect(gte(info!.latest, '0.6.0')).toBeTruthy();
  }
});

test('Root admin can edit server media settings', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const customSettings = {
    avifEnabled: true,
    useOriginalsForLightbox: true,
    thumbnailSmallPx: 240,
    thumbnailMediumPx: 640,
    thumbnailLargePx: 3000,
    thumbnailJpegQuality: 72,
    thumbnailAvifQuality: 48,
  };

  try {
    const editResult = await client
      .mutation(editServerSettingsMutation, { input: customSettings })
      .toPromise();
    expect(editResult.error).toBeUndefined();
    expect(editResult.data?.editServerSettings).toMatchObject({
      ...customSettings,
      thumbnailDimensions: { sm: 240, md: 640, lg: 3000 },
    });

    const infoResult = await client.query(serverInfoQuery, {}).toPromise();
    expect(infoResult.error).toBeUndefined();
    expect(infoResult.data?.serverInfo?.settings).toMatchObject({
      ...customSettings,
      thumbnailDimensions: { sm: 240, md: 640, lg: 3000 },
    });

    const meResult = await client.query(meQuery, {}).toPromise();
    expect(meResult.error).toBeUndefined();
    expect(meResult.data?.clientInfo).toMatchObject({
      ...customSettings,
      thumbnailDimensions: { sm: 240, md: 640, lg: 3000 },
    });
  } finally {
    await client
      .mutation(editServerSettingsMutation, {
        input: DEFAULT_SERVER_MEDIA_SETTINGS,
      })
      .toPromise();
  }
});
