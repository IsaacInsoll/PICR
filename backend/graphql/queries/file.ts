import FileModel from '../../db/FileModel';
import { contextPermissions } from '../../auth/contextPermissions';

import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface';

const resolver = async (_, params, context) => {
  const file = await FileModel.findByPk(params.id);
  await contextPermissions(context, file.folderId, 'View');
  return fileToJSON(file);
};

export const file = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
