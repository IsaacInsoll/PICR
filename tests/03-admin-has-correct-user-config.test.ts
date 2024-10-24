import { expect, test } from 'vitest';
import { createTestGraphqlClient } from '../frontend/testGraphqlClient';
import { meQuery } from '../frontend/src/hooks/useMe';

test('Admin has correct user config', async () => {
  const client = await createTestGraphqlClient({});
  const result = await client.query(meQuery, {}).toPromise();
  // const result = await adminGraphqlClient({ query: raw });
  expect(result.error).toBeUndefined();
  expect(result.data.me).toBeDefined();

  const { me } = result.data;
  expect(me.id).toEqual('1');
  expect(me.commentPermissions).toEqual('edit');
  expect(me.folder).toStrictEqual({ id: '1', name: 'Home' });
});
