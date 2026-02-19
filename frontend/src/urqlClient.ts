import { Client, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';
import type { Exchange } from 'urql';
import { getUUID } from './helpers/getUUID';
import { urqlCacheExchange } from './urql/urqlCacheExchange';
import { withBasePath } from './helpers/baseHref';
import { globalErrorExchange } from './urql/globalErrorExchange';

const retry = retryExchange({ initialDelayMs: 500 }) as unknown as Exchange;

export const createClient = (authToken: string, sessionKey: string) =>
  new Client({
    url: withBasePath('graphql'),
    suspense: true,
    exchanges: [urqlCacheExchange, retry, globalErrorExchange, fetchExchange],
    fetchOptions: () => {
      const uuid = getUUID();
      return {
        headers: {
          authorization: authToken !== '' && !uuid ? `Bearer ${authToken}` : '',
          uuid: uuid ?? '',
          sessionId: sessionKey,
        },
      };
    },
  });
