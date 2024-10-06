import { GraphQLEnumType } from 'graphql';

export const commentPermissionsEnum = new GraphQLEnumType({
  name: 'CommentPermissions',
  values: {
    none: { value: 'none' },
    read: { value: 'read' },
    edit: { value: 'edit' },
  },
});
