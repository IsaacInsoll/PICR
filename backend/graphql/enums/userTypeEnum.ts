import { GraphQLEnumType } from 'graphql';

export const userTypeEnum = new GraphQLEnumType({
  name: 'UserType',
  values: {
    User: { value: 'User' },
    Link: { value: 'Link' },
    All: { value: 'All' },
  },
});
