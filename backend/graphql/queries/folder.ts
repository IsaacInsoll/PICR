import { contextPermissions } from '../../auth/contextPermissions.js';
import type { Folder , QueryFolderArgs } from '@shared/gql/graphql.js';
import { AccessType } from '@shared/gql/graphql.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType.js';
import { createAccessLog } from '../../db/picrDb.js';

const folderResolver: PicrResolver<Partial<Folder>, QueryFolderArgs> = async (
  _,
  params,
  context,
) => {
  const { permissions, user, folder } = await contextPermissions(
    context,
    params.id,
    'View',
  );
  await createAccessLog(user, folder, context, AccessType.View);
  return { ...folder, permissions };
};

export const folder = {
  type: new GraphQLNonNull(folderType),
  resolve: folderResolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
