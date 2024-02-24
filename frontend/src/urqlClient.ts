import { Client, cacheExchange, fetchExchange } from 'urql';

export const createClient = (authToken: string) =>
  new Client({
    url: '/graphql',
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => {
      return {
        headers: {
          authorization: authToken !== '' ? `Bearer ${authToken}` : '',
        },
      };
    },
  });
