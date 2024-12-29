import { GraphQLError } from 'graphql/error';

export const doAuthError = (str: string | undefined) => {
  throw new GraphQLError('AUTH' + (str ? `: ${str}` : ''));
};
