import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { getUUID } from './Router';

const cx = cacheExchange({
  keys: {
    ImageMetadataSummary: () => null,
    VideoMetadataSummary: () => null,
    Task: () => null,
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
          authorization: authToken !== '' && !uuid ? `Bearer ${authToken}` : '',
          uuid: uuid ?? '',
        },
      };
    },
  });
