import { Client, fetchExchange } from 'urql';
import { getUUID } from './helpers/getUUID';
import { urqlCacheExchange } from './urql/urqlCacheExchange';
import { withBasePath } from './helpers/baseHref';

export const createClient = (authToken: string, sessionKey: string) =>
  new Client({
    url: withBasePath('graphql'),
    suspense: true,
    exchanges: [urqlCacheExchange, fetchExchange],
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
