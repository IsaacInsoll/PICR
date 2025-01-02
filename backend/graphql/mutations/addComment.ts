import { GraphQLID, GraphQLNonNull } from 'graphql/type';
import { contextPermissions } from '../../auth/contextPermissions';
import { doAuthError } from '../../auth/doAuthError';
import FileModel from '../../db/FileModel';
import { CommentFor } from '../../db/CommentModel';
import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLInt, GraphQLString } from 'graphql';
import { fileFlagEnum } from '../enums/fileFlagEnum';
import { fileInterface } from '../interfaces/fileInterface';
import sanitizeHtml from 'sanitize-html';

const resolver = async (_, params, context) => {
  const file = await FileModel.findByPk(params.id);
  const { user } = await contextPermissions(context, file.folderId, 'View');

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
    const realComment = await CommentFor(file, user);
    // no point sanitizing as it gets escaped on the front end anyway, and un-escaping is a PITA
    // realComment.comment = sanitizeHtml(params.comment);
    realComment.comment = params.comment;
    // if (params.nickName) realComment.nickName = params.nickName;
    await realComment.save();
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
