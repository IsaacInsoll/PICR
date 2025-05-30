import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderPermissionsType } from './folderPermissionsType.js';
import { fileInterface } from '../interfaces/fileInterface.js';
import { imageFileType } from './imageFileType.js';
import { brandingType } from './brandingType.js';
import { parentFolders } from '../../helpers/parentFolders.js';
import { brandingForFolder } from '../helpers/brandingForFolder.js';
import { heroImageForFolder } from '../helpers/heroImageForFolder.js';
import { subFolders } from '../helpers/subFolders.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { userType } from './userType.js';
import { userToJSON } from '../helpers/userToJSON.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { db, FolderFields, getFilesForFolder } from '../../db/picrDb.js';
import { and, count, eq, inArray, sum } from 'drizzle-orm';
import { dbFile, dbUser } from '../../db/models/index.js';
import { GraphQLDateTime } from 'graphql-scalars';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

export const folderType: GraphQLObjectType<any, any> = new GraphQLObjectType({
  name: 'Folder',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    folderLastModified: { type: new GraphQLNonNull(GraphQLDateTime) },
    parentId: { type: GraphQLID },
    subFolders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: async (f: FolderFields) => subFolders(f.id),
    },
    parents: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: (f: FolderFields, params, context: PicrRequestContext) => {
        return parentFolders(f, context);
      },
    },
    files: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(fileInterface)),
      ),
      resolve: async (f: FolderFields) => getFilesForFolder(f.id),
    },
    heroImage: {
      type: imageFileType,
      resolve: async (f: FolderFields) => heroImageForFolder(f),
    },
    permissions: { type: folderPermissionsType },
    branding: {
      type: brandingType,
      resolve: async (f: FolderFields) => {
        return await brandingForFolder(f);
      },
    },
    totalSize: {
      type: new GraphQLNonNull(GraphQLString), // because GraphQLInt is 32bit which is TINY
      resolve: async (f: FolderFields, params, context) => {
        const folderIds = await allSubfolderIds(f);

        const totes = await db
          .select({ value: sum(dbFile.fileSize) })
          .from(dbFile)
          .where(
            and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
          );

        return totes[0].value ?? '0';
      },
    },
    totalDirectSize: {
      type: new GraphQLNonNull(GraphQLString), // because GraphQLInt is 32bit which is TINY
      resolve: async (f: FolderFields, params, context) => {
        const totes = await db
          .select({ value: sum(dbFile.fileSize) })
          .from(dbFile)
          .where(and(eq(dbFile.folderId, f.id), eq(dbFile.exists, true)));

        return totes[0].value ?? '0';
      },
    },
    totalFiles: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: FolderFields, params, context) => {
        const folderIds = await allSubfolderIds(f);
        const total = await db
          .select({ count: count() })
          .from(dbFile)
          .where(
            and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
          );
        return total[0].count;
      },
    },
    totalFolders: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: FolderFields, params, context) => {
        const total = await allSubfolderIds(f);
        return total.length - 1;
      },
    },
    totalImages: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async (f: FolderFields, params, context) => {
        const folderIds = await allSubfolderIds(f);
        const total = await db
          .select({ count: count() })
          .from(dbFile)
          .where(
            and(
              eq(dbFile.type, 'Image'),
              inArray(dbFile.folderId, folderIds),
              eq(dbFile.exists, true),
            ),
          );
        return total[0].count;
      },
    },
    users: {
      type: new GraphQLList(new GraphQLNonNull(userType)),
      resolve: async (f: FolderFields, params, context) => {
        //TODO: handle this better: viewing a folder with a lot of subfolders calls this query a bunch of times and slows shit down
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
