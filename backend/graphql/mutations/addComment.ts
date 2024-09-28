import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { fileType } from '../types/fileType';
import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import File from '../../models/File';
import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLInt, GraphQLString } from 'graphql';
import { fileFlagEnum } from '../enums/fileFlagEnum';
import { fileInterface } from '../interfaces/fileInterface';

const resolver = async (_, params, context) => {
  const file = await File.findByPk(params.id);
  const [p, u] = await perms(context, file.folderId, true);
  if (p == 'None') doAuthError("You don't have permissions for this folder");

  //TODO: set rating, flag
  if (params.rating) {
    file.rating = params.rating;
  }
  if (params.flag) {
    file.flag = params.flag == 'none' ? null : params.flag;
  }

  await file.save();
  // TODO: read 'name' as entered by client (optional) will also be linked to their (public) User
  // TODO: set comment

  return fileToJSON(file);
};

export const addComment = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    // All these are optional
    name: { type: GraphQLString },
    rating: { type: GraphQLInt },
    flag: { type: fileFlagEnum },
    comment: { type: GraphQLString },
  },
};
