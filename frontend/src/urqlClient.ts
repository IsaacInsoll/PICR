import { createAdminAuthExchanges } from './urql/adminAuthExchange';
import { Client, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';
import type { Exchange } from 'urql';
import { getUUID } from './helpers/getUUID';
import { urqlCacheExchange } from './urql/urqlCacheExchange';
import { withBasePath } from './helpers/baseHref';
import { globalErrorExchange } from './urql/globalErrorExchange';
import {
  getPublicLinkPasscode,
  publicLinkPasscodeHeader,
} from './helpers/publicLinkPasscode';
import { visibilityHeader } from '@shared/realVisit';

const retry: Exchange = retryExchange({ initialDelayMs: 500 });

export const createClient = (principal: string, sessionKey: string) =>
  new Client({
    url: withBasePath('graphql'),
    suspense: true,
    exchanges: [
      urqlCacheExchange,
      globalErrorExchange,
      ...(principal ? createAdminAuthExchanges() : []),
      retry,
      fetchExchange,
    ],
    fetchOptions: () => {
      const uuid = getUUID();
      const headers: Record<string, string> = { sessionId: sessionKey };
      if (typeof document !== 'undefined') {
        headers[visibilityHeader] = document.visibilityState;
      }
      if (uuid) {
        headers['uuid'] = uuid;
        const passcode = getPublicLinkPasscode(uuid);
        if (passcode) headers[publicLinkPasscodeHeader] = passcode;
      }
      return {
        headers,
      };
    },
  });
