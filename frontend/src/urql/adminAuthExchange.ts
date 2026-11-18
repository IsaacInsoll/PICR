import { authExchange } from '@urql/exchange-auth';
import { AUTH_REASON } from '@shared/auth/authErrorContract';
import { isAuthExpiredError } from '@shared/urql/errorClassification';
import { GraphQLError } from 'graphql';
import { CombinedError, mapExchange } from 'urql';
import type { Exchange, Operation } from 'urql';
import { getDefaultStore } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import {
  adminAccessTokenNeedsRefresh,
  AuthRequestError,
  refreshSession,
} from '../helpers/adminSession';
import { getUUID } from '../helpers/getUUID';

/** Keep PICR's result conventions beside URQL's standard refresh/queue machinery. */
export function createAdminAuthExchanges(): Exchange[] {
  const store = getDefaultStore();
  const partiallySucceeded = new WeakSet<Operation>();
  const normalizeResults = mapExchange({
    onResult: (result) => {
      if (getUUID()) return result;
      const data: unknown = result.data;
      if (
        result.operation.kind === 'mutation' &&
        data &&
        typeof data === 'object' &&
        Object.values(data).some((value) => value != null)
      ) {
        partiallySucceeded.add(result.operation);
      }
      // A missing admin principal makes Query.me return null rather than an error.
      if (
        result.operation.kind !== 'query' ||
        !data ||
        typeof data !== 'object' ||
        !('me' in data) ||
        data.me !== null
      )
        return result;
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
    },
  });
  const authentication = authExchange(async (utilities) => ({
    addAuthToOperation: (operation) => {
      if (getUUID()) return operation;
      const token = store.get(authKeyAtom);
      // Replace any header left on a queued operation, including after logout.
      return utilities.appendHeaders(operation, {
        authorization: token ? `Bearer ${token}` : '',
      });
    },
    willAuthError: () =>
      !getUUID() && !!store.get(authKeyAtom) && adminAccessTokenNeedsRefresh(),
    didAuthError: (error, operation) =>
      !getUUID() &&
      !!store.get(authKeyAtom) &&
      !partiallySucceeded.has(operation) &&
      isAuthExpiredError(error),
    refreshAuth: async () => {
      try {
        await refreshSession(true);
      } catch (error) {
        // A rejected refresh has already cleared the session. Let the queued
        // operation finish once unauthenticated so normal logout handling runs.
        if (!(error instanceof AuthRequestError) || error.status !== 401)
          throw error;
      }
    },
  }));
  return [authentication, normalizeResults];
}
