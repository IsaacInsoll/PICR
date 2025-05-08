import { contextPermissions } from '../../auth/contextPermissions.js';

import { fileToJSON } from '../helpers/fileToJSON.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface.js';
import { GraphQLError } from 'graphql/error/index.js';
import { dbFileForId } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
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
