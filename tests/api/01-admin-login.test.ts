import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../../frontend/testGraphqlClient';
import { loginMutation } from '../../shared/urql/mutations/loginMutation';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { meQuery } from '../../shared/urql/queries/meQuery';
import { serverInfoQuery } from '../../shared/urql/queries/serverInfoQuery';
import { gte } from 'semver';

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
  expect(me?.folder).toStrictEqual({ id: '1', name: 'Home' });
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
  expect(gte(info!.latest, '0.6.0')).toBeTruthy();
});
