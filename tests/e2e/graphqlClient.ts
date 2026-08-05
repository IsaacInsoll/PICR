import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { testUrl } from '../api/testVariables';
import { loginMutationText } from './mutations';

// Minimal fetch-based GraphQL caller for Playwright specs that need to set up
// server state before driving the browser. Operations stay local to tests/e2e/
// (see tests/AGENTS.md) rather than importing shared/urql documents.
export type GqlResult<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  headers: HeadersInit = {},
) {
  const response = await fetch(testUrl + 'graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as GqlResult<T>;
}

export async function adminAuthHeader() {
  const result = await gqlRequest<{ auth?: string }>(
    loginMutationText,
    defaultCredentials,
  );
  const token = result.data?.auth;
  if (!token) {
    throw new Error(
      `Authentication failed: ${JSON.stringify(result.errors ?? [])}`,
    );
  }
  return { authorization: `Bearer ${token}` };
}
