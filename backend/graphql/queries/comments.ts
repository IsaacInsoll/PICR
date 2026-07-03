import { contextPermissions } from '../../auth/contextPermissions.js';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { commentType } from '../types/commentType.js';
import { GraphQLError } from 'graphql/error/index.js';
import { doAuthError } from '../../auth/doAuthError.js';
import { addUserRelationship } from '../helpers/addUserRelationship.js';
import type { FileFields } from '../../db/picrDb.js';
import { db, dbFileForId, getFilesForIds } from '../../db/picrDb.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { dbComment } from '../../db/models/index.js';
import { desc, eq, inArray } from 'drizzle-orm';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { QueryCommentsArgs } from '@shared/gql/graphql.js';

const MAX_COMMENTS_LIMIT = 100;

const normalizeLimit = (limit?: number | null) => {
  if (limit == null) return undefined;
  if (limit < 1) {
    throw new GraphQLError('limit must be greater than zero', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return Math.min(limit, MAX_COMMENTS_LIMIT);
};

const resolver: PicrResolver<object, QueryCommentsArgs> = async (
  _,
  params,
  context,
) => {
  if (!params.fileId && !params.folderId) {
    throw new GraphQLError('Must specify either fileId or folderId');
  }
  //presume file, otherwise try folder
  const limit = normalizeLimit(params.limit);

  if (params.fileId) {
    const file = await dbFileForId(params.fileId);
    if (!file) throw new GraphQLError('File not found');
    const { user } = await contextPermissions(context, file.folderId, 'View');
    if (user.commentPermissions === 'none') {
      doAuthError('COMMENTS_HIDDEN');
    }

    const list = await db.query.dbComment.findMany({
      where: eq(dbComment.fileId, file.id),
      orderBy: desc(dbComment.createdAt),
      limit,
    });

    return addUserRelationship(
      list.map((x) => {
        return {
          ...x,
          timestamp: x.createdAt,
          file: file,
        };
      }),
    );
  } else {
    const folderId = params.folderId as number;
    const { user, folder } = await contextPermissions(
      context,
      folderId,
      'View',
    );
    if (user.commentPermissions === 'none') {
      doAuthError('COMMENTS_HIDDEN');
    }

    // Optionally include the whole subtree (used by the dashboard feed).
    const folderIds = params.includeChildren
      ? await allSubfolderIds(folder)
      : [folderId];

    const list = await db.query.dbComment.findMany({
      where:
        folderIds.length === 1
          ? eq(dbComment.folderId, folderIds[0])
          : inArray(dbComment.folderId, folderIds),
      orderBy: desc(dbComment.createdAt),
      limit,
    });

    // Only load the files actually referenced by these comments (scales with the
    // limit, not the size of the subtree).
    const fileIds = [
      ...new Set(
        list.map((c) => c.fileId).filter((id): id is number => id != null),
      ),
    ];
    const files: Record<number, FileFields> = {};
    (await getFilesForIds(fileIds)).forEach((f) => {
      files[f.id] = f;
    });

    return addUserRelationship(
      list.map((x) => {
        return {
          ...x,
          timestamp: x.createdAt,
          file: x.fileId ? files[x.fileId] : undefined,
        };
      }),
    );
  }
};

export const comments = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(commentType))),
  resolve: resolver,
  args: {
    fileId: { type: GraphQLID },
    folderId: { type: GraphQLID },
    includeChildren: { type: GraphQLBoolean },
    limit: { type: GraphQLInt },
  },
};
