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
import type { UserFields } from '../../db/picrDb.js';
import { db, dbFolderForId, dbUserForId } from '../../db/picrDb.js';
import { and, eq, ne } from 'drizzle-orm';
import { dbUser } from '../../db/models/index.js';
import { UserType } from '@shared/gql/graphql.js';
import { commentPermissionsEnum } from '../types/enums.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationEditAdminUserArgs } from '@shared/gql/graphql.js';

const resolver: PicrResolver<object, MutationEditAdminUserArgs> = async (
  _,
  params,
  context,
) => {
  if (params.folderId == null) {
    throw new GraphQLError('Missing required folderId');
  }
  if (!params.name) {
    throw new GraphQLError('Missing required name');
  }

  const { user } = await contextPermissions(context, params.folderId, 'Admin');
  let adminUser: UserFields | undefined;

  const pass = params.password;
  const username = params.username;
  if (pass && pass.length < 8) {
    throw new GraphQLError('Password must be at least 8 characters long');
  }

  if (username) {
    const existingUsername = await db.query.dbUser.findFirst({
      where: and(
        eq(dbUser.username, username),
        ne(dbUser.userType, 'Link'),
        eq(dbUser.deleted, false),
      ),
    });

    if (existingUsername) {
      if (existingUsername.id !== params.id || !params.id) {
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
    if (!pass || !username) {
      throw new GraphQLError(
        'Cannot create new user without username and password',
      );
    }
  }

  if (adminUser) {
    adminUser.folderId = params.folderId;
    adminUser.name = params.name;
    adminUser.username = params.username ?? null;
    adminUser.enabled = params.enabled ?? adminUser.enabled ?? true;
    adminUser.ntfy = params.ntfy ?? null;
    adminUser.ntfyEmail = params.ntfyEmail ?? adminUser.ntfyEmail ?? false;
    adminUser.commentPermissions =
      params.commentPermissions ?? adminUser.commentPermissions ?? 'edit';
    adminUser.updatedAt = new Date();
    if (pass) adminUser.hashedPassword = hashPassword(pass);
    await db.update(dbUser).set(adminUser).where(eq(dbUser.id, adminUser.id));
    return { ...adminUser, folder: dbFolderForId(adminUser.folderId) };
  }

  const createPassword = params.password;
  if (!createPassword) {
    throw new GraphQLError(
      'Cannot create new user without username and password',
    );
  }
  const newAdminUser = await db
    .insert(dbUser)
    .values({
      folderId: params.folderId,
      name: params.name,
      username: params.username ?? null,
      hashedPassword: hashPassword(createPassword),
      enabled: params.enabled ?? true,
      ntfy: params.ntfy ?? null,
      ntfyEmail: params.ntfyEmail ?? false,
      commentPermissions: params.commentPermissions ?? 'edit',
      createdAt: new Date(),
      updatedAt: new Date(),
      userType: UserType.Admin,
    })
    .returning();

  const created = newAdminUser[0];
  return { ...created, folder: dbFolderForId(created.folderId) };
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
    ntfyEmail: { type: GraphQLBoolean },
  },
};
