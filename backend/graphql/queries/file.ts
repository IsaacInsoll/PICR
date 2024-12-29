import File from '../../models/File';
import { contextPermissions } from '../../auth/contextPermissions';

import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface';

const resolver = async (_, params, context) => {
  const file = await File.findByPk(params.id);
  await contextPermissions(context, file.folderId, 'View');
  return fileToJSON(file);
};

export const file = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
