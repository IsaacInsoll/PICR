import { GraphQLError } from 'graphql/error/index.js';

export const doAuthError = (str: string | undefined) => {
  throw new GraphQLError('AUTH' + (str ? `: ${str}` : ''));
};
