import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { getUUID } from './Router';

export const createClient = (authToken: string) =>
  new Client({
    url: '/graphql',
    suspense: true,
    exchanges: [cacheExchange({}), fetchExchange],
    fetchOptions: () => {
      const uuid = getUUID();
      return {
        headers: {
          authorization: authToken !== '' ? `Bearer ${authToken}` : '',
          uuid: uuid ?? '',
        },
      };
    },
  });
