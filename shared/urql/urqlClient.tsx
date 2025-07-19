import { urqlCacheExchange } from './urqlCacheExchange';
import { Client, fetchExchange, Provider } from 'urql';
import { retryExchange } from '@urql/exchange-retry';

const retry = retryExchange({ initialDelayMs: 500 });

// copied from App version, refactor to support frontend (web) as well
export const picrUrqlClient = (url: string, headers: HeadersInit) => {
  return new Client({
    url: url + 'graphql',
    suspense: true,
    exchanges: [urqlCacheExchange, retry, fetchExchange],
    fetchOptions: () => {
      return { headers };
    },
  });
};

// export const PicrUrqlProvider = ({ client, children }) => {
//   return <Provider value={client}>{children}</Provider>;
// };
