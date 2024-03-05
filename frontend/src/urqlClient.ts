import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { getUUID } from './Router';

const cx = cacheExchange({
  keys: {
    MetadataSummary: () => null,
  },
});

export const createClient = (authToken: string) =>
  new Client({
    url: '/graphql',
    suspense: true,
    exchanges: [cx, fetchExchange],
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
