import { contextPermissions } from '../../auth/contextPermissions';

import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface';
import { GraphQLError } from 'graphql/error';
import { dbFileForId } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const file = await dbFileForId(params.id);
  await contextPermissions(context, file?.folderId, 'View');
  if (!file?.exists) throw new GraphQLError('File not found');
  return fileToJSON(file);
};

export const file = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
