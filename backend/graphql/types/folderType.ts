import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderPermissionsType } from './folderPermissionsType';
import FolderModel from '../../db/sequelize/FolderModel';
import FileModel from '../../db/sequelize/FileModel';
import { fileInterface } from '../interfaces/fileInterface';
import { imageFileType } from './imageFileType';
import { brandingType } from './brandingType';
import { parentFolders } from '../../helpers/parentFolders';
import { brandingForFolder } from '../helpers/brandingForFolder';
import { heroImageForFolder } from '../helpers/heroImageForFolder';
import { subFiles } from '../helpers/subFiles';
import { subFolders } from '../helpers/subFolders';
import { allSubfolderIds } from '../../helpers/allSubfolders';
import { userType } from './userType';
import { userToJSON } from '../helpers/userToJSON';
import { contextPermissions } from '../../auth/contextPermissions';
import { db } from '../../db/picrDb';
import { eq } from 'drizzle-orm';
import { dbUser } from '../../db/models';

export const folderType = new GraphQLObjectType({
  name: 'Folder',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    parentId: { type: GraphQLID },
    subFolders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: async (f: FolderModel) => subFolders(f.id),
    },
    parents: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: (f: FolderModel, params, context) => {
        return parentFolders(f, context);
      },
    },
    files: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(fileInterface)),
      ),
      resolve: async (f: FolderModel) => subFiles(f.id),
    },
    heroImage: {
      type: imageFileType,
      resolve: async (f: FolderModel) => heroImageForFolder(f),
    },
    permissions: { type: folderPermissionsType },
    branding: {
      type: brandingType,
      resolve: async (f: FolderModel) => {
        return await brandingForFolder(f);
      },
    },
    totalSize: {
      type: new GraphQLNonNull(GraphQLString), // because GraphQLInt is 32bit which is TINY
      resolve: async (f: FolderModel, params, context) => {
        const folderIds = await allSubfolderIds(f);
        const totes = await FileModel.sum('fileSize', {
          where: { folderId: folderIds, exists: true },
        });
        return totes ?? '0';
      },
    },
    totalDirectSize: {
      type: new GraphQLNonNull(GraphQLString), // because GraphQLInt is 32bit which is TINY
      resolve: async (f: FolderModel, params, context) => {
        const totes = await FileModel.sum('fileSize', {
          where: { folderId: f.id, exists: true },
        });
        return totes ?? '0';
      },
    },
    totalFiles: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: FolderModel, params, context) => {
        const folderIds = await allSubfolderIds(f);
        return await FileModel.count({
          where: { folderId: folderIds, exists: true },
        });
      },
    },
    totalFolders: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: FolderModel, params, context) => {
        const total = await allSubfolderIds(f);
        return total.length - 1;
      },
    },
    totalImages: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: FolderModel, params, context) => {
        const folderIds = await allSubfolderIds(f);
        return await FileModel.count({
          where: { folderId: folderIds, type: 'Image', exists: true },
        });
      },
    },
    users: {
      type: new GraphQLList(new GraphQLNonNull(userType)),
      resolve: async (f: FolderModel, params, context) => {
        const { permissions } = await contextPermissions(context, f.id);
        if (permissions != 'Admin') return null;

        const users = await db.query.dbUser.findMany({
          where: eq(dbUser.folderId, f.id),
        });

        return users.map((pl) => {
          return { ...userToJSON(pl) };
        });
      },
    },
  }),
});
