import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../frontend/testGraphqlClient';
import { loginMutation } from '../frontend/src/urql/mutations/loginMutation';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { meQuery } from '../frontend/src/urql/queries/meQuery';
import { serverInfoQuery } from '../frontend/src/urql/queries/serverInfoQuery';
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
