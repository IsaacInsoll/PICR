import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { getUUID } from './Router';
import schema from './../public/graphql.schema.json';

const cx = cacheExchange({
  schema,
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
