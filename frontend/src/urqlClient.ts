import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

export const createClient = (authToken: string) =>
  new Client({
    url: '/graphql',
    exchanges: [cacheExchange({}), fetchExchange],
    fetchOptions: () => {
      return {
        headers: {
          authorization: authToken !== '' ? `Bearer ${authToken}` : '',
        },
      };
    },
  });
