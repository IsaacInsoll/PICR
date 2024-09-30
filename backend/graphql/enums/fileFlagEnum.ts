import { GraphQLEnumType } from 'graphql';

export const fileFlagEnum = new GraphQLEnumType({
  name: 'FileFlag',
  values: {
    approved: { value: 'approved' },
    rejected: { value: 'rejected' },
    none: { value: 'none' },
  },
});
