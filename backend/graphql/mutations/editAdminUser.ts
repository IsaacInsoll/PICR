import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLError } from 'graphql/error/index.js';
import { hashPassword } from '../../helpers/hashPassword.js';

import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { userType } from '../types/userType.js';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId.js';
import { db, dbFolderForId, dbUserForId, UserFields } from '../../db/picrDb.js';
import { and, eq, ne } from 'drizzle-orm';
import { dbUser } from '../../db/models/index.js';
import { UserType } from '../../../graphql-types.js';
import { commentPermissionsEnum } from '../types/enums.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const { user } = await contextPermissions(context, params.folderId, 'Admin');
  let adminUser: UserFields | undefined = undefined;

  const pass = params.password;
  const username = params.username;
  if (pass && pass.length < 8) {
    throw new GraphQLError('Password must be at least 8 characters long');
  }

  if (username) {
    const existingUsername = await db.query.dbUser.findFirst({
      where: and(eq(dbUser.username, username), ne(dbUser.userType, 'Link')),
    });

    if (existingUsername) {
      if (existingUsername.id != params.id || !params.id) {
        throw new GraphQLError(`Username "${username} already exists`);
      }
    }
  }

  if (params.id) {
    adminUser = await dbUserForId(params.id);
    if (!adminUser)
      throw new GraphQLError('No user found for ID: ' + params.id);
    const userFolder = await dbFolderForId(adminUser.folderId);
    if (!userFolder)
      throw new GraphQLError('User has invalid folder: ' + adminUser.folderId);
    if (!(await folderIsUnderFolderId(userFolder, user.folderId))) {
      throw new GraphQLError(
        'You cant edit this user as they are above your level of access',
      );
    }
  } else {
    if (pass && username) {
      // @ts-ignore required fields added below
      adminUser = {};
    } else {
      throw new GraphQLError(
        'Cannot create new user without username and password',
      );
    }
  }

  if (!adminUser) return; // just to fix the "adminUser might be undefined" error below in typescript, not needed

  adminUser.folderId = params.folderId;
  adminUser.name = params.name;

  adminUser.username = params.username;
  adminUser.enabled = params.enabled;
  adminUser.ntfy = params.ntfy;
  adminUser.commentPermissions = params.commentPermissions;
  adminUser.updatedAt = new Date();
  if (pass) adminUser.hashedPassword = hashPassword(pass);

  if (adminUser.id) {
    await db.update(dbUser).set(adminUser).where(eq(dbUser.id, adminUser.id));
  } else {
    await db.insert(dbUser).values({
      ...adminUser,
      createdAt: new Date(),
      userType: UserType.Admin,
    });
  }

  return { ...adminUser, folder: dbFolderForId(adminUser.folderId) };
};

export const editAdminUser = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: GraphQLID },
    folderId: { type: GraphQLID },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    password: { type: GraphQLString },
    enabled: { type: GraphQLBoolean },
    commentPermissions: { type: commentPermissionsEnum },
    ntfy: { type: GraphQLString },
  },
};
