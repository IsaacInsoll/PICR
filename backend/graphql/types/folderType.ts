import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderPermissionsType } from './folderPermissionsType';
import { allChildFolderIds } from '../../helpers/allChildFolderIds';
import Folder from '../../models/Folder';
import File from '../../models/File';
import { fileInterface } from '../interfaces/fileInterface';
import { imageFileType } from './imageFileType';
import { brandingType } from './brandingType';
import { parentFolders } from '../../helpers/parentFolders';
import { brandingForFolder } from '../helpers/brandingForFolder';
import { heroImageForFolder } from '../helpers/heroImageForFolder';
import { subFiles } from '../helpers/subFiles';
import { subFolders } from '../helpers/subFolders';

export const folderType = new GraphQLObjectType({
  name: 'Folder',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    parentId: { type: GraphQLID },
    subFolders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: async (f: Folder) => subFolders(f.id),
    },
    parents: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: (f: Folder, params, context) => {
        return parentFolders(f, context);
      },
    },
    files: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(fileInterface)),
      ),
      resolve: async (f: Folder) => subFiles(f.id),
    },
    heroImage: {
      type: imageFileType,
      resolve: async (f: Folder) => heroImageForFolder(f),
    },
    permissions: { type: folderPermissionsType },
    branding: {
      type: brandingType,
      resolve: async (f: Folder) => {
        return await brandingForFolder(f);
      },
    },
    totalSize: {
      type: new GraphQLNonNull(GraphQLString), // because GraphQLInt is 32bit which is TINY
      resolve: async (f: Folder, params, context) => {
        const folderIds = await allChildFolderIds(f);
        const totes = await File.sum('fileSize', {
          where: { folderId: folderIds },
        });
        return totes ?? '0';
      },
    },
    totalFiles: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: Folder, params, context) => {
        const folderIds = await allChildFolderIds(f);
        return await File.count({ where: { folderId: folderIds } });
      },
    },
    totalFolders: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: Folder, params, context) => {
        const total = await allChildFolderIds(f);
        return total.length - 1;
      },
    },
    totalImages: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: Folder, params, context) => {
        const folderIds = await allChildFolderIds(f);
        return await File.count({
          where: { folderId: folderIds, type: 'Image' },
        });
      },
    },
  }),
});
