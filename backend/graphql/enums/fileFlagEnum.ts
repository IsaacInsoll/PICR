import { GraphQLEnumType } from 'graphql';

export const fileFlagEnum = new GraphQLEnumType({
  name: 'FileFlag',
  values: {
    Approved: { value: 'Approved' },
    Rejected: { value: 'Rejected' },
  },
});
