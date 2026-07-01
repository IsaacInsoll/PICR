import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderType } from './folderType.js';
import { GraphQLDateTime } from 'graphql-scalars';
import { commentPermissionsEnum, userTypeEnum, linkModeEnum } from './enums.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import type { PicrRequestContext } from '../../types/PicrRequestContext.js';

type UserTypeSource = {
  folderId: number;
  galleryPasscode?: string | null;
};

export const userType = new GraphQLObjectType<
  UserTypeSource,
  PicrRequestContext
>({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    uuid: { type: GraphQLString }, // can be null if 'real user'
    username: { type: GraphQLString }, // null if not 'real user'
    enabled: { type: GraphQLBoolean },
    deleted: { type: GraphQLBoolean },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    folder: { type: folderType },
    commentPermissions: { type: commentPermissionsEnum },
    gravatar: { type: GraphQLString },
    ntfy: { type: GraphQLString },
    ntfyEmail: { type: GraphQLBoolean },
    lastAccess: { type: GraphQLDateTime },
    userType: { type: userTypeEnum },
    linkMode: { type: linkModeEnum },
    hasGalleryPasscode: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (user: { galleryPasscode?: string | null }) =>
        !!user.galleryPasscode,
    },
    galleryPasscode: {
      type: GraphQLString,
      resolve: async (user: UserTypeSource, _, context: PicrRequestContext) => {
        if (context.user?.userType !== 'Admin') return null;
        const { permissions } = await contextPermissions(
          context,
          user.folderId,
        );
        return permissions === 'Admin' ? (user.galleryPasscode ?? null) : null;
      },
    },
  }),
});
