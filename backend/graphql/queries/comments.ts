import File from '../../models/File';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { commentType } from '../types/commentType';
import Comment from '../../models/Comment';
import { GraphQLError } from 'graphql/error';
import { subFiles, subFilesMap } from '../helpers/subFiles';
import { fileToJSON } from '../helpers/fileToJSON';
import { Order } from 'sequelize';
import { commentTable } from '../../db/models/commentTable';
import { db } from '../../server';
import { desc, eq } from 'drizzle-orm';
import { file } from './file';

const resolver = async (_, params, context) => {
  //TODO: maybe support subfolders?
  //TODO: pagination?
  if (!params.fileId && !params.folderId) {
    throw new GraphQLError('Must specify either fileId or folderId');
  }

  if (params.fileId) {
    const file = await File.findByPk(params.fileId);
    const [p, u] = await contextPermissionsForFolder(
      context,
      file.folderId,
      true,
    );
    // const list = await Comment.findAll({ where: { fileId: file.id }, order });
    const list = await db
      .select()
      .from(commentTable)
      .where(eq(commentTable.fileId, file.id))
      .orderBy(desc(commentTable.createdAt));

    return list.map((x) => {
      return { ...x, timestamp: x.createdAt, file: file.toJSON() };
    });
  } else {
    const folderId = params.folderId;
    const [p, u] = await contextPermissionsForFolder(context, folderId, true);
    const files = await subFilesMap(folderId);

    const list = await db
      .select()
      .from(commentTable)
      .where(eq(commentTable.folderId, folderId))
      .orderBy(desc(commentTable.createdAt));

    return list.map((x) => {
      return { ...x, timestamp: x.createdAt, file: files[x.fileId] };
    });
  }
};

export const comments = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(commentType))),
  resolve: resolver,
  args: { fileId: { type: GraphQLID }, folderId: { type: GraphQLID } },
};
