import { GraphQLEnumType } from 'graphql';

export const userTypeEnum = new GraphQLEnumType({
  name: 'UserType',
  values: {
    Link: { value: 'Link' },
    User: { value: 'User' },
    Admin: { value: 'Admin' },
    All: { value: 'All' },
  },
});
