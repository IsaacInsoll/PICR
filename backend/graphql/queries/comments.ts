import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { commentType } from '../types/commentType';
import { GraphQLError } from 'graphql/error';
import { subFilesMap } from '../helpers/subFiles';
import { addUserRelationship } from '../helpers/addUserRelationship';
import { db, dbFileForId } from '../../db/picrDb';
import { dbComment } from '../../db/models';
import { desc, eq } from 'drizzle-orm';

const resolver = async (_, params, context) => {
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
