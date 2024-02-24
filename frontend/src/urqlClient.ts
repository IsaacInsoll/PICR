import { Client, cacheExchange, fetchExchange } from 'urql';

var authToken = '';

export const client = new Client({
  url: '/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    return {
      headers: { authorization: authToken ? `Bearer ${authToken}` : '' },
    };
  },
});

export const setAuthToken = (token: string | undefined) => {
  authToken = token ?? '';
  console.log('Auth Token now: ', authToken);
};
