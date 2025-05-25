import { Client, fetchExchange } from 'urql';

export const urqlClient = async (url: string, headers: HeadersInit) => {
  return new Client({
    url: url + 'graphql',
    suspense: true,
    exchanges: [fetchExchange],
    fetchOptions: () => {
      return { headers };
    },
  });
};
