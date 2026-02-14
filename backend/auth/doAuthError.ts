import { GraphQLError } from 'graphql/error/index.js';
import {
  authErrorCatalog,
  type AuthErrorReason,
} from '../../shared/auth/authErrorContract.js';

export const doAuthError = (
  authCode: AuthErrorReason,
  detail?: string,
): never => {
  const config = authErrorCatalog[authCode];
  throw new GraphQLError(config.message, {
    extensions: {
      code: config.code,
      reason: authCode,
      detail,
    },
  });
};
