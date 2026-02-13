import { urqlCacheExchange } from './urqlCacheExchange';
import {
  classifyGlobalUrqlError,
  isAuthExpiredError,
} from './errorClassification';
import { Client, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';
import type { Exchange } from 'urql';
import { pipe, tap } from 'wonka';

const retry = retryExchange({ initialDelayMs: 500 });

interface PicrUrqlClientOptions {
  onGlobalError?: (message: {
    type: 'network_unavailable' | 'no_permissions';
    message: string;
  }) => void;
  onAuthExpired?: () => void;
}

// copied from App version, refactor to support frontend (web) as well
export const picrUrqlClient = (
  url: string,
  headers: HeadersInit,
  options?: PicrUrqlClientOptions,
) => {
  const onGlobalError = options?.onGlobalError;
  const onAuthExpired = options?.onAuthExpired;
  const globalErrorExchange: Exchange =
    ({ forward }) =>
    (ops$) =>
      pipe(
        forward(ops$),
        tap((result) => {
          if (onAuthExpired && isAuthExpiredError(result.error)) {
            onAuthExpired();
            return;
          }
          if (!onGlobalError) return;
          const match = classifyGlobalUrqlError(result.error);
          if (!match) return;
          onGlobalError(match);
        }),
      );

  return new Client({
    url: url + 'graphql',
    suspense: true,
    exchanges: [urqlCacheExchange, retry, globalErrorExchange, fetchExchange],
    fetchOptions: () => {
      return { headers };
    },
  });
};
