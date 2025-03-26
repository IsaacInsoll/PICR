import FileModel from '../../db/FileModel';
import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { commentType } from '../types/commentType';
import CommentModel from '../../db/CommentModel';
import { GraphQLError } from 'graphql/error';
import { subFilesMap } from '../helpers/subFiles';
import { Order } from 'sequelize';
import { commentTable } from '../../db/models/commentTable';
import { db } from '../../server';
import { desc, eq } from 'drizzle-orm';
import { file } from './file';
import { addUserRelationship } from '../helpers/addUserRelationship';

const resolver = async (_, params, context) => {
  //TODO: maybe support subfolders?
  //TODO: pagination?
  if (!params.fileId && !params.folderId) {
    throw new GraphQLError('Must specify either fileId or folderId');
  }

  if (params.fileId) {
    const file = await File.findByPk(params.fileId);
    await contextPermissions(context, file.folderId, 'View');

    // const list = await Comment.findAll({ where: { fileId: file.id }, order });
    const list = await db
      .select()
      .from(commentTable)
      .where(eq(commentTable.fileId, file.id))
      .orderBy(desc(commentTable.createdAt));

    return list.map((x) => {
      return { ...x, timestamp: x.createdAt, file: file.toJSON() };
    const file = await FileModel.findByPk(params.fileId);
    await contextPermissions(context, file.folderId, 'View');
    const list = await CommentModel.findAll({
      where: { fileId: file.id },
      order,
    });
    return addUserRelationship(
      list.map((x) => {
        return {
          ...x.toJSON(),
          timestamp: x.createdAt,
          file: file.toJSON(),
        };
      }),
    );
  } else {
    const folderId = params.folderId;
    await contextPermissions(context, folderId, 'View');
    const files = await subFilesMap(folderId);

    const list = await db
      .select()
      .from(commentTable)
      .where(eq(commentTable.folderId, folderId))
      .orderBy(desc(commentTable.createdAt));

    return addUserRelationship(
      list.map((x) => {
        return {
          ...x.toJSON(),
          timestamp: x.createdAt,
          file: files[x.fileId],
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
