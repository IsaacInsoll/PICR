import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { commentType } from '../types/commentType.js';
import { GraphQLError } from 'graphql/error/index.js';
import { subFilesMap } from '../helpers/subFiles.js';
import { addUserRelationship } from '../helpers/addUserRelationship.js';
import { db, dbFileForId } from '../../db/picrDb.js';
import { dbComment } from '../../db/models/index.js';
import { desc, eq } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  //TODO: maybe support subfolders?
  //TODO: pagination?
  if (!params.fileId && !params.folderId) {
    throw new GraphQLError('Must specify either fileId or folderId');
  }
  //presume file, otherwise try folder

  if (params.fileId) {
    const file = await dbFileForId(params.fileId);
    await contextPermissions(context, file?.folderId, 'View');

    const list = await db.query.dbComment.findMany({
      where: eq(dbComment.fileId, file!.id),
      orderBy: desc(dbComment.createdAt),
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
    const folderId = params.folderId;
    await contextPermissions(context, folderId, 'View');
    const files = await subFilesMap(folderId);

    const list = await db.query.dbComment.findMany({
      where: eq(dbComment.folderId, folderId),
      orderBy: desc(dbComment.createdAt),
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
  args: { fileId: { type: GraphQLID }, folderId: { type: GraphQLID } },
};
