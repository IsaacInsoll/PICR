import { Client, cacheExchange, fetchExchange } from 'urql';
import { isDev } from './isDev';

export const authToken = '';

export const client = new Client({
  url: '/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    return {
      headers: { authorization: authToken ? `Bearer ${authToken}` : '' },
    };
  },
});
