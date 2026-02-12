import type { CombinedError } from 'urql';
import {
  AUTH_REASON,
  authErrorCatalog,
  isAuthErrorReason,
} from '../auth/authErrorContract';

export type GlobalErrorType = 'network_unavailable' | 'no_permissions';

export interface GlobalErrorMatch {
  type: GlobalErrorType;
  message: string;
}

const networkMarkers = [
  'failed to fetch',
  'network request failed',
  'networkerror',
  'load failed',
  'fetch failed',
];

const permissionFallbackMarkers = ['access denied', 'forbidden', 'invalid link'];

const normalize = (value?: string | null) => (value ?? '').toLowerCase();

export const isAuthExpiredError = (error?: CombinedError): boolean => {
  if (!error) return false;
  return error.graphQLErrors.some(
    (entry) =>
      entry.extensions?.code === 'UNAUTHENTICATED' &&
      entry.extensions?.reason === AUTH_REASON.NOT_LOGGED_IN,
  );
};

export const classifyGlobalUrqlError = (
  error?: CombinedError,
): GlobalErrorMatch | null => {
  if (!error) return null;

  const normalizedMessage = normalize(error.message);

  if (
    error.networkError ||
    networkMarkers.some((marker) => normalizedMessage.includes(marker))
  ) {
    return { type: 'network_unavailable', message: error.message };
  }

  const graphQLErrors = error.graphQLErrors ?? [];
  const graphqlText = graphQLErrors.map((entry) => normalize(entry.message)).join(' ');
  const allText = `${normalizedMessage} ${graphqlText}`.trim();

  const extensionCodes = new Set(
    graphQLErrors
      .map((entry) => entry.extensions?.code)
      .filter((value): value is string => typeof value === 'string'),
  );
  const hasForbiddenCode = extensionCodes.has('FORBIDDEN');
  const hasUnauthenticatedCode = extensionCodes.has('UNAUTHENTICATED');
  const reasonCodes = new Set(
    graphQLErrors
      .map((entry) => entry.extensions?.reason)
      .filter(isAuthErrorReason),
  );

  if (
    hasUnauthenticatedCode ||
    reasonCodes.has(AUTH_REASON.NOT_LOGGED_IN) ||
    allText.includes('not logged in')
  ) {
    return null;
  }

  if (extensionCodes.has('BAD_USER_INPUT')) {
    return null;
  }

  if (hasForbiddenCode) {
    return { type: 'no_permissions', message: error.message };
  }

  if (
    [...reasonCodes].some(
      (reason) => authErrorCatalog[reason].globalAction === 'global_no_permissions',
    )
  ) {
    return { type: 'no_permissions', message: error.message };
  }

  if (permissionFallbackMarkers.some((marker) => allText.includes(marker))) {
    return { type: 'no_permissions', message: error.message };
  }

  return null;
};
