import File from '../../models/File';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';

import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface';

const resolver = async (_, params, context) => {
  const file = await File.findByPk(params.id);
  const [p, u] = await contextPermissionsForFolder(
    context,
    file.folderId,
    true,
  );
  return fileToJSON(file);
};

export const file = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
