import type { CombinedError } from 'urql';
import {
  AUTH_REASON,
  authErrorCatalog,
  isAuthErrorReason,
  type AuthErrorReason,
} from '../auth/authErrorContract';

export type GlobalErrorType = 'network_unavailable' | 'no_permissions';
export type GlobalErrorReason = {
  [Reason in AuthErrorReason]: (typeof authErrorCatalog)[Reason]['globalAction'] extends 'global_no_permissions'
    ? Reason
    : never;
}[AuthErrorReason];

const isGlobalErrorReason = (
  reason: AuthErrorReason,
): reason is GlobalErrorReason =>
  authErrorCatalog[reason].globalAction === 'global_no_permissions';

export interface GlobalErrorMatch {
  type: GlobalErrorType;
  reason?: GlobalErrorReason;
  diagnosticMessage?: string;
}

export const isAuthExpiredError = (error?: CombinedError): boolean => {
  if (!error) return false;
  return error.graphQLErrors.some(
    (entry) =>
      entry.extensions['code'] === 'UNAUTHENTICATED' &&
      entry.extensions['reason'] === AUTH_REASON.NOT_LOGGED_IN,
  );
};

export const isPublicLinkExpiredError = (error?: CombinedError): boolean => {
  if (!error) return false;
  return error.graphQLErrors.some(
    (entry) =>
      entry.extensions['code'] === 'FORBIDDEN' &&
      entry.extensions['reason'] === AUTH_REASON.PUBLIC_LINK_EXPIRED,
  );
};

export const classifyGlobalUrqlError = (
  error?: CombinedError,
): GlobalErrorMatch | null => {
  if (!error) return null;

  if (error.networkError) {
    return {
      type: 'network_unavailable',
      diagnosticMessage: error.message,
    };
  }

  const graphQLErrors = error.graphQLErrors;
  const extensionCodes = new Set(
    graphQLErrors
      .map((entry) => entry.extensions['code'])
      .filter((value): value is string => typeof value === 'string'),
  );
  const hasForbiddenCode = extensionCodes.has('FORBIDDEN');
  const hasUnauthenticatedCode = extensionCodes.has('UNAUTHENTICATED');
  const reasonCodes = new Set(
    graphQLErrors
      .map((entry) => entry.extensions['reason'])
      .filter(isAuthErrorReason),
  );

  if (hasUnauthenticatedCode || reasonCodes.has(AUTH_REASON.NOT_LOGGED_IN)) {
    return null;
  }

  if (extensionCodes.has('BAD_USER_INPUT')) {
    return null;
  }

  const reason = [...reasonCodes].find(isGlobalErrorReason);
  if (reason || hasForbiddenCode) {
    return {
      type: 'no_permissions',
      reason,
      diagnosticMessage: error.message,
    };
  }

  return null;
};
