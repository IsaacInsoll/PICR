import { GraphQLFieldResolver } from 'graphql/type';
import { Folder as GqlFolder, Folder } from '../../../graphql-types';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';
import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import { allSubFoldersRecursive } from '../helpers/allSubFoldersRecursive';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { folderType } from '../types/folderType';

const resolver: GraphQLFieldResolver<Folder, IncomingCustomHeaders> = async (
  _,
  params,
  context,
  info,
): Promise<Folder[]> => {
  const [permissions, u] = await perms(context, params.id, true);
  if (permissions !== 'Admin') doAuthError('Access Denied');
  const folders = (await allSubFoldersRecursive(params.id)) as unknown;
  return folders as GqlFolder[];
};

export const allFolders = {
  type: new GraphQLNonNull(new GraphQLList(folderType)),
  resolve: resolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};
