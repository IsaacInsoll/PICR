import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { fileType } from '../types/fileType';
import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import File from '../../models/File';
import Comment, { CommentFor } from '../../models/Comment';
import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLInt, GraphQLString } from 'graphql';
import { fileFlagEnum } from '../enums/fileFlagEnum';
import { fileInterface } from '../interfaces/fileInterface';
import { isEmpty } from 'lodash';
import sanitizeHtml from 'sanitize-html';

const resolver = async (_, params, context) => {
  const file = await File.findByPk(params.id);
  const [p, user] = await perms(context, file.folderId, true);
  if (p == 'None') doAuthError("You don't have permissions for this folder");

  const json = {};

  //TODO: set rating, flag
  if (params.rating != null) {
    json.rating = params.rating;
    file.rating = params.rating;
  }
  if (params.flag) {
    json.flag = params.flag;
    file.flag = params.flag == 'none' ? null : params.flag;
  }
  if (!isEmpty(json)) {
    const log = CommentFor(file, user, true);
    log.comment = JSON.stringify(json);
    if (params.nickName) log.nickName = params.nickName;
    await log.save();
  }

  if (params.comment) {
    const realComment = CommentFor(file, user);
    realComment.comment = sanitizeHtml(params.comment);
    if (params.nickName) realComment.nickName = params.nickName;
    await realComment.save();
    file.totalComments = file.totalComments + 1;
  }

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
