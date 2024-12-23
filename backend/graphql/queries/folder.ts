import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { createAccessLog } from '../../models/AccessLog';
import { Folder } from '../../../graphql-types';
import { GraphQLFieldResolver } from 'graphql/type';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';
import { getFolder } from '../helpers/getFolder';
import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { folderType } from '../types/folderType';
import { BrandingForFolder } from '../../auth/folderUtils';

const folderResolver: GraphQLFieldResolver<
  Folder,
  IncomingCustomHeaders
> = async (_, params, context, info): Promise<Folder> => {
  const [permissions, u] = await perms(context, params.id, true);
  const f = await getFolder(params.id);
  // const branding = await BrandingForFolder(f);
  const data = { ...f, permissions };
  createAccessLog(u.id, f.id);
  return data;
};

export const folder = {
  type: new GraphQLNonNull(folderType),
  resolve: folderResolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
