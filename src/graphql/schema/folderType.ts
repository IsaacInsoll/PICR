import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { fileType } from './fileType';
import { folderPermissionsType } from './folderPermissionsType';
import { ParentFolders } from '../../auth/folderUtils';
import Folder from '../../models/Folder';

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
    parents: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: (f: Folder, params, context) => {
        return ParentFolders(f, context);
      },
    },
    files: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(fileType))),
    },
    permissions: { type: folderPermissionsType },
    fullSize: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: (f: Folder, params, context) => {
        return 420;
      },
    },
  }),
});
