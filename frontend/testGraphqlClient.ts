import { loginMutation } from '../shared/urql/mutations/loginMutation';
import { ICredentials } from '../backend/auth/defaultCredentials';
import { Client, fetchExchange } from 'urql';

import { testUrl } from '../tests/testVariables';

// This uses the URQL Client so it needs to be in frontend as thats where package is installed
export const createTestGraphqlClient = async (headers: HeadersInit) => {
  return new Client({
    url: testUrl + 'graphql',
    suspense: true,
    exchanges: [fetchExchange],
    fetchOptions: () => {
      return { headers };
    },
  });
};

export const getUserHeader = async (credentials: ICredentials) => {
  const client = await createTestGraphqlClient({});
  const result = await client.mutation(loginMutation, credentials).toPromise();
  if (result.error || !result.data.auth || !result.data.auth.startsWith('ey'))
    throw new Error('Authentication failed');
  return { authorization: `Bearer ${result.data.auth}` };
};

export const getLinkHeader = async (uuid: string) => {
  return { uuid };
};
