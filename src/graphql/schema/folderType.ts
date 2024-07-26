import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { fileInterface } from './fileType';
import { folderPermissionsType } from './folderPermissionsType';
import { AllChildFolderIds, ParentFolders } from '../../auth/folderUtils';
import Folder from '../../models/Folder';
import File from '../../models/File';

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
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(fileInterface))),
    },
    permissions: { type: folderPermissionsType },
    totalSize: {
      type: new GraphQLNonNull(GraphQLString), // because GraphQLInt is 32bit which is TINY
      resolve: async (f: Folder, params, context) => {
        const folderIds = await AllChildFolderIds(f);
        const totes = await File.sum('fileSize', {
          where: { folderId: folderIds },
        });
        return totes ?? '0';
      },
    },
    totalFiles: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: Folder, params, context) => {
        const folderIds = await AllChildFolderIds(f);
        return await File.count({ where: { folderId: folderIds } });
      },
    },
    totalFolders: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: Folder, params, context) => {
        const total = await AllChildFolderIds(f);
        return total.length - 1;
      },
    },
    totalImages: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: Folder, params, context) => {
        const folderIds = await AllChildFolderIds(f);
        return await File.count({
          where: { folderId: folderIds, type: 'Image' },
        });
      },
    },
  }),
});
