import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { Folder as GqlFolder, Folder } from '../../../graphql-types.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { allSubfolders } from '../../helpers/allSubfolders.js';
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { folderType } from '../types/folderType.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const resolver: GraphQLFieldResolver<Folder, PicrRequestContext> = async (
  _,
  params,
  context,
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
