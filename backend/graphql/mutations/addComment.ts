import { GraphQLID, GraphQLNonNull } from 'graphql/type';
import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import File from '../../models/File';
import { CommentFor } from '../../models/Comment';
import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLInt, GraphQLString } from 'graphql';
import { fileFlagEnum } from '../enums/fileFlagEnum';
import { fileInterface } from '../interfaces/fileInterface';
import sanitizeHtml from 'sanitize-html';

const resolver = async (_, params, context) => {
  const file = await File.findByPk(params.id);
  const [p, user] = await perms(context, file.folderId, true);
  if (p == 'None') doAuthError("You don't have permissions for this folder");
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
    realComment.comment = sanitizeHtml(params.comment);
    // if (params.nickName) realComment.nickName = params.nickName;
    await realComment.save();
    file.totalComments = file.totalComments + 1;
  }

  file.latestComment = Date.now();
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
