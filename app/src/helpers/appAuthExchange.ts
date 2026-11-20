import { authExchange } from '@urql/exchange-auth';
import { getDefaultStore } from 'jotai';
import { GraphQLError } from 'graphql';
import { CombinedError, mapExchange } from 'urql';
import type { Exchange, Operation } from 'urql';
import { isAuthExpiredError } from '@shared/urql/errorClassification';
import { AUTH_REASON } from '@shared/auth/authErrorContract';
import { loginDetailsAtom } from '../hooks/useLoginDetails';
import { isRejectedNativeSession } from './nativeAuthRequest';
import {
  appSessionIdentity,
  appTokenNeedsRefresh,
  refreshAppSession,
} from './appSession';

export function createAppAuthExchanges(identity: string): Exchange[] {
  const store = getDefaultStore();
  const partial = new WeakSet<Operation>();
  const current = () => {
    const login = store.get(loginDetailsAtom);
    return login && appSessionIdentity(login.token) === identity
      ? login
      : undefined;
  };
  const normalize = mapExchange({
    onResult: (result) => {
      const data: unknown = result.data;
      if (
        result.operation.kind === 'mutation' &&
        data &&
        typeof data === 'object' &&
        Object.values(data).some((value) => value != null)
      )
        partial.add(result.operation);
      if (
        result.operation.kind === 'query' &&
        data &&
        typeof data === 'object' &&
        'me' in data &&
        data.me === null
      )
        return {
          ...result,
          error: new CombinedError({
            graphQLErrors: [
              ...(result.error?.graphQLErrors ?? []),
              new GraphQLError('Not logged in', {
                extensions: {
                  code: 'UNAUTHENTICATED',
                  reason: AUTH_REASON.NOT_LOGGED_IN,
                },
              }),
            ],
          }),
        };
      return result;
    },
  });
  const auth = authExchange(async (utilities) => ({
    addAuthToOperation: (operation) =>
      utilities.appendHeaders(operation, {
        authorization: current() ? `Bearer ${current()?.token}` : '',
      }),
    willAuthError: () => !!current() && appTokenNeedsRefresh(),
    didAuthError: (error, operation) =>
      !!current() && !partial.has(operation) && isAuthExpiredError(error),
    refreshAuth: async () => {
      try {
        if (current()) await refreshAppSession(true);
      } catch (error) {
        // A definitive rejection has cleared the session. Finish queued work
        // unauthenticated so it is not reported as a connection failure.
        if (!isRejectedNativeSession(error)) throw error;
      }
    },
  }));
  return [auth, normalize];
}
