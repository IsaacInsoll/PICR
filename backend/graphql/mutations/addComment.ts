import { GraphQLID, GraphQLNonNull } from 'graphql/type';
import { contextPermissions } from '../../auth/contextPermissions';
import { doAuthError } from '../../auth/doAuthError';
import FileModel from '../../db/sequelize/FileModel';
import { CommentFor } from '../../db/CommentModel';
import File from '../../models/File';
import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLInt, GraphQLString } from 'graphql';
import { fileFlagEnum } from '../enums/fileFlagEnum';
import { fileInterface } from '../interfaces/fileInterface';
import { GraphQLError } from 'graphql/error';
import User from '../../models/User';
import { db } from '../../server';
import { commentTable } from '../../db/models/commentTable';

const resolver = async (_, params, context) => {
  const file = await FileModel.findByPk(params.id);
  const { user } = await contextPermissions(context, file.folderId, 'View');
  if (!file.exists) throw new GraphQLError('File not found');

  if (user.commentPermissions != 'edit') doAuthError('Not allowed to comment');

  //TODO: set rating, flag
  if (params.rating != null) {
    file.rating = params.rating;
    await CommentFor(file, user, { rating: params.rating });
  }
  if (params.flag) {
    file.flag = params.flag == 'none' ? null : params.flag;
    await CommentFor(file, user, { flag: params.flag });
  }

  if (params.comment) {
    await CommentFor(file, user, null, params.comment);
    file.totalComments = file.totalComments + 1;
  }

  file.latestComment = new Date();
  await file.save();

  return fileToJSON(file);
};

export const addComment = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    // All these are optional
    nickName: { type: GraphQLString },
    rating: { type: GraphQLInt },
    flag: { type: fileFlagEnum },
    comment: { type: GraphQLString },
  },
};

const CommentFor = async (
  file: File,
  user: User,
  systemGenerated?: object,
  comment?: string,
): Promise<typeof commentTable.$inferSelect> => {
  const insert: typeof commentTable.$inferInsert = {
    updatedAt: new Date(),
    folderId: file.folderId,
    fileId: file.id,
    userId: user.id,
    systemGenerated: false,
  };

  if (systemGenerated) {
    insert.systemGenerated = true;
    insert.comment = JSON.stringify(systemGenerated);
  } else {
    insert.comment = sanitizeHtml(comment);
  }
  const ret = await db.insert(commentTable).values(insert).returning();
  return ret[0];
};
