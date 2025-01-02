import { contextPermissions } from '../../auth/contextPermissions';
import { createAccessLog } from '../../db/AccessLogModel';
import { Folder } from '../../../graphql-types';
import { GraphQLFieldResolver } from 'graphql/type';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';
import { getFolder } from '../helpers/getFolder';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType';

const folderResolver: GraphQLFieldResolver<
  Folder,
  IncomingCustomHeaders
> = async (_, params, context, info): Promise<Folder> => {
  const { permissions, user } = await contextPermissions(
    context,
    params.id,
    'View',
  );
  const f = await getFolder(params.id);
  const data = { ...f, permissions };
  await createAccessLog(user.id, f.id, context);
  return data;
};

export const folder = {
  type: new GraphQLNonNull(folderType),
  resolve: folderResolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
