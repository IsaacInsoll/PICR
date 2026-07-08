import { contextPermissions } from '../../auth/contextPermissions.js';
import { scanFolderTree } from '../../filesystem/scanFolder.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationRescanFolderArgs } from '@shared/gql/graphql.js';

const resolver: PicrResolver<object, MutationRescanFolderArgs> = async (
  _,
  params,
  context,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const result = await scanFolderTree(folder.id, { generateThumbs: true });
  return result.completed;
};

export const rescanFolder = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
  },
};
