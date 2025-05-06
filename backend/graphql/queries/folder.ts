import { contextPermissions } from '../../auth/contextPermissions.js';
import { AccessType, Folder } from '../../../graphql-types.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType.js';
import { createAccessLog } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const folderResolver: GraphQLFieldResolver<Folder, PicrRequestContext> = async (
  _,
  params,
  context,
  info,
): Promise<Partial<Folder>> => {
  const { permissions, user, folder } = await contextPermissions(
    context,
    params.id,
    'View',
  );
  const data = { ...folder, permissions };
  await createAccessLog(user, folder, context, AccessType.View);
  // @ts-ignore folder.id types incompatible
  return data;
};

export const folder = {
  type: new GraphQLNonNull(folderType),
  resolve: folderResolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
