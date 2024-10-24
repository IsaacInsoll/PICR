import { expect, test } from 'vitest';
import { adminGraphqlClient } from './testGraphqlClient';
import { meQuery } from '../frontend/src/hooks/useMe';
import { User } from '../graphql-types';
import { print } from 'graphql/language/printer';

test('Admin has correct user config', async () => {
  const raw = print(meQuery);
  const result = await adminGraphqlClient({ query: raw });
  const me: User = result.me;
  expect(me.id).toEqual('1');
  expect(me.commentPermissions).toEqual('edit');
  expect(me.folder).toStrictEqual({ id: '1', name: 'Home' });
});
