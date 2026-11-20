import { getAdminAccessToken } from '../adminAuth';
import { Client, fetchExchange } from 'urql';
import type { ICredentials } from '../../shared/types/credentials';

import { testUrl } from './testVariables';

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
  const token = await getAdminAccessToken(testUrl, credentials);
  return { authorization: `Bearer ${token}` };
};

export const getLinkHeader = async (uuid: string, galleryPasscode?: string) => {
  return {
    uuid,
    ...(galleryPasscode ? { 'gallery-passcode': galleryPasscode } : {}),
  };
};
