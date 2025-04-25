import { GraphQLFieldResolver } from 'graphql/type';
import { Folder as GqlFolder, Folder } from '../../../graphql-types';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';
import { contextPermissions } from '../../auth/contextPermissions';
import { allSubfolders } from '../../helpers/allSubfolders';
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { folderType } from '../types/folderType';

const resolver: GraphQLFieldResolver<Folder, IncomingCustomHeaders> = async (
  _,
  params,
  context,
  info,
): Promise<Folder[]> => {
  await contextPermissions(context, params.id, 'Admin');
  const folders = (await allSubfolders(
    params.id,
    params.sort,
    params.limit,
  )) as unknown;
  return folders as GqlFolder[];
};

const allFoldersSortEnum = new GraphQLEnumType({
  name: 'FoldersSortType',
  values: {
    name: { value: 'name' },
    folderLastModified: { value: 'folderLastModified' },
  },
});

export const allFolders = {
  type: new GraphQLNonNull(new GraphQLList(folderType)),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    sort: { type: allFoldersSortEnum },
    limit: { type: GraphQLInt },
  },
};
