import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLError } from 'graphql/error/index.js';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { userType } from '../types/userType.js';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId.js';
import { badChars } from '../../../shared/badChars.js';
import type { UserFields } from '../../db/picrDb.js';
import { db, dbFolderForId, dbUserForId } from '../../db/picrDb.js';
import { and, eq, ne } from 'drizzle-orm';
import { dbUser } from '../../db/models/index.js';
import { LinkMode, UserType } from '../../../shared/gql/graphql.js';
import { commentPermissionsEnum, linkModeEnum } from '../types/enums.js';
import { userToJSON } from '../helpers/userToJSON.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationEditUserArgs } from '../../../shared/gql/graphql.js';

const resolver: PicrResolver<object, MutationEditUserArgs> = async (
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
  if (params.enabled == null) {
    throw new GraphQLError('Missing required enabled');
  }
  if (!params.commentPermissions) {
    throw new GraphQLError('Missing required commentPermissions');
  }
  if (!params.uuid) {
    throw new GraphQLError('Missing required uuid');
  }

  await contextPermissions(context, params.folderId, 'Admin');

  let user: UserFields | undefined;
  if (params.id) {
    user = await dbUserForId(params.id);
    if (!user) throw new GraphQLError('No user found for ID: ' + params.id);
    const userFolder = await dbFolderForId(user.folderId);
    if (!userFolder)
      throw new GraphQLError('User has invalid folder: ' + user.folderId);
    const folderAllowed = await folderIsUnderFolderId(
      userFolder,
      params.folderId,
    );

    if (!folderAllowed)
      throw new GraphQLError(
        "You don't have access to edit users in folder " + userFolder.id,
      );
  }

  if (params.uuid.length < 6) {
    throw new GraphQLError('Public Link Address must be at least 6 characters');
  }

  if (badChars(params.uuid).length > 0) {
    throw new GraphQLError(
      "Public Link Address can't contain these characters: " +
        badChars(params.uuid).join(', '),
    );
  }

  const existingUuid = await db.query.dbUser.findFirst({
    where: and(
      eq(dbUser.uuid, params.uuid),
      ne(dbUser.id, user ? user.id : 0),
      eq(dbUser.deleted, false),
    ),
  });

  if (existingUuid) {
    throw new GraphQLError('Public Link Address already used');
  }

  if (user) {
    user.folderId = params.folderId;
    user.name = params.name;
    user.username = params.username ?? null;
    user.uuid = params.uuid;
    user.enabled = params.enabled;
    user.commentPermissions = params.commentPermissions;
    user.linkMode = params.linkMode ?? LinkMode.FinalDelivery;
    user.updatedAt = new Date();
    await db.update(dbUser).set(user).where(eq(dbUser.id, user.id));
    return { ...userToJSON(user), folder: dbFolderForId(user.folderId) };
  }

  const newUser = await db
    .insert(dbUser)
    .values({
      folderId: params.folderId,
      name: params.name,
      username: params.username ?? null,
      uuid: params.uuid,
      enabled: params.enabled,
      commentPermissions: params.commentPermissions,
      linkMode: params.linkMode ?? LinkMode.FinalDelivery,
      createdAt: new Date(),
      updatedAt: new Date(),
      userType: UserType.Link,
    })
    .returning();

  const created = newUser[0];
  return { ...userToJSON(created), folder: dbFolderForId(created.folderId) };
};

export const editUser = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: GraphQLID },
    folderId: { type: GraphQLID },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    uuid: { type: GraphQLString },
    enabled: { type: GraphQLBoolean },
    commentPermissions: { type: commentPermissionsEnum },
    linkMode: { type: linkModeEnum },
  },
};
