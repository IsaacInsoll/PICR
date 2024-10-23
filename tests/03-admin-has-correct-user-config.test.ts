import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
  testClientCredentials,
} from '../frontend/testGraphqlClient';
import { meQuery } from '../frontend/src/hooks/useMe';
import { defaultCredentials } from '../backend/auth/defaultCredentials';

test('Admin has correct user config', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client.query(meQuery, {}).toPromise();
  // console.log(result);
  expect(result.error).toBeUndefined();
  expect(result.data.me).toBeDefined();

  const { me } = result.data;
  expect(me.id).toEqual('1');
  expect(me.commentPermissions).toEqual('edit');
  expect(me.folder).toStrictEqual({ id: '1', name: 'Home' });
});
