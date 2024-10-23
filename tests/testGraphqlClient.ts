import { loginMutationRaw } from '../frontend/src/urql/mutations/LoginMutation';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { expect } from 'vitest';

interface BaseParams {
  query: string;
  variables?: object;
  extraHeaders?: object;
}

const url = 'http://localhost:6969/graphql';
const baseHeaders = {
  'content-type': 'application/json',
};

export const testGraphqlClient = async ({
  query,
  variables,
  extraHeaders,
}: BaseParams) => {
  const body = JSON.stringify({ query, variables });
  const headers = { ...baseHeaders, ...extraHeaders };
  const response = await fetch(url, { headers, method: 'POST', body });
  const result = await response.json();
  expect(result.errors).toBeUndefined();
  return result.data;
};

export const adminGraphqlClient = async ({
  query,
  variables,
  extraHeaders,
}: BaseParams) => {
  const authResponse = await testGraphqlClient({
    query: loginMutationRaw,
    variables: defaultCredentials,
  });
  // console.log(authResponse);
  const jwt = authResponse.auth;
  if (!jwt || !jwt.startsWith('ey')) {
    throw new Error('Login failed for defaultCredentials');
  }
  const h = { ...extraHeaders, authorization: `Bearer ${jwt}` };
  const result = await testGraphqlClient({ query, variables, extraHeaders: h });
  return result;
};
