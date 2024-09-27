import { GraphQLEnumType } from 'graphql';

export const folderPermissionsType = new GraphQLEnumType({
  name: 'FolderPermissions',
  values: {
    View: { value: 'View' },
    Admin: { value: 'Admin' },
    None: { value: 'None' },
  },
});
