import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLError } from 'graphql/error';
import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { userType } from '../types/userType';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId';
import { badChars } from '../helpers/badChars';
import { db, dbFolderForId, dbUserForId, UserFields } from '../../db/picrDb';
import { and, eq, ne } from 'drizzle-orm';
import { dbUser } from '../../db/models';
import { UserType } from '../../../graphql-types';
import { commentPermissionsEnum } from '../types/enums';
import { userToJSON } from '../helpers/userToJSON';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
  await contextPermissions(context, params.folderId, 'Admin');

  let user: UserFields | undefined = undefined;
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
  } else {
    // @ts-ignore required fields added below
    user = {};
  }

  const existingUuid = await db.query.dbUser.findFirst({
    where: and(eq(dbUser.uuid, params.uuid), ne(dbUser.id, user?.id ?? 0)),
  });

  if (existingUuid) {
    throw new GraphQLError('Public Link Address already used');
  }

  if (!params.uuid || params.uuid.length < 6) {
    throw new GraphQLError('Public Link Address must be at least 6 characters');
  }

  if (badChars(params.uuid).length > 0) {
    throw new GraphQLError(
      "Public Link Address can't contain these characters: " +
        badChars(params.uuid).join(', '),
    );
  }

  if (!user) return; // just to fix the "adminUser might be undefined" error below in typescript, not needed

  user.folderId = params.folderId;
  user.name = params.name;
  user.username = params.username;
  user.uuid = params.uuid;
  user.enabled = params.enabled;
  user.commentPermissions = params.commentPermissions;
  user.updatedAt = new Date();

  if (user.id) {
    await db.update(dbUser).set(user).where(eq(dbUser.id, user.id));
    return { ...userToJSON(user), folder: dbFolderForId(user.folderId) };
  } else {
    const newUser = await db
      .insert(dbUser)
      .values({
        ...user,
        createdAt: new Date(),
        userType: UserType.Link,
      })
      .returning();

    return { ...userToJSON(newUser[0]), folder: dbFolderForId(user.folderId) };
  }
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
  },
};
