import { expect, test } from 'vitest';
import { adminGraphqlClient } from './testGraphqlClient';
import { meQueryRaw } from '../frontend/src/hooks/useMe';
import { User } from '../graphql-types';

test('Admin has correct user config', async () => {
  const result = await adminGraphqlClient({ query: meQueryRaw });
  const me: User = result.me;
  expect(me.id).toEqual('1');
  expect(me.commentPermissions).toEqual('edit');
  expect(me.folder).toStrictEqual({ id: '1', name: 'Home' });
});
