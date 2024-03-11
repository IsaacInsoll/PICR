import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { fileType } from './fileType';
import { folderPermissionsType } from './folderPermissionsType';

export const folderType = new GraphQLObjectType({
  name: 'Folder',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    parentId: { type: GraphQLID },
    subFolders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      // resolve: resolver(User.Tasks)
    },
    parent: { type: folderType },
    files: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(fileType))),
    },
    permissions: { type: folderPermissionsType },
  }),
});
