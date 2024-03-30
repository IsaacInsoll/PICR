import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';
import { createAccessLog } from '../../models/AccessLog';
import { Folder } from '../../../graphql-types';
import { GraphQLFieldResolver } from 'graphql/type';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';

export const folderResolver: GraphQLFieldResolver<
  Folder,
  IncomingCustomHeaders
> = async (_, params, context, info): Promise<Folder> => {
  const [permissions, u] = await perms(context, params.id, true);
  const f = await getFolder(params.id);
  const data = { ...f, permissions };
  createAccessLog(u.id, f.id);
  return data;
};
