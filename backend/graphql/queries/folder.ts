import { contextPermissions } from '../../auth/contextPermissions';
import { AccessType, Folder } from '../../../graphql-types';
import { GraphQLFieldResolver } from 'graphql/type';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType';
import { createAccessLog } from '../../db/picrDb';

const folderResolver: GraphQLFieldResolver<
  Folder,
  IncomingCustomHeaders
> = async (_, params, context, info): Promise<Partial<Folder>> => {
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
