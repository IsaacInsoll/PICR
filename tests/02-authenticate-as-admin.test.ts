import { expect, test } from 'vitest';
import { createTestGraphqlClient } from '../frontend/testGraphqlClient';
import { loginMutation } from '../frontend/src/urql/mutations/LoginMutation';
import { defaultCredentials } from '../backend/auth/defaultCredentials';

test('Login Mutation Works', async () => {
  const client = await createTestGraphqlClient({});
  const result = await client
    .mutation(loginMutation, defaultCredentials)
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(result.data.auth).toBeDefined();
  const auth = result.data.auth;
  expect(auth).not.toBe('');
  expect(auth.startsWith('ey')).toBe(true); //valid JWT starts with `ey`
});
