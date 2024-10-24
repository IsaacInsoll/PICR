import { expect, test } from 'vitest';
import { testGraphqlClient } from '../frontend/testGraphqlClient';
import { loginMutationRaw } from '../frontend/src/urql/mutations/LoginMutation';
import { defaultCredentials } from '../backend/auth/defaultCredentials';

test('Login Mutation Works', async () => {
  const result = await testGraphqlClient({
    query: loginMutationRaw,
    variables: defaultCredentials,
  });

  expect(result).toHaveProperty('auth');
  expect(result.auth).not.toBe('');
  expect(result.auth.startsWith('ey')).toBe(true); //valid JWT starts with `ey`
});
