import type { PicrResolver } from '../helpers/picrResolver.js';
import type { QueryAllFoldersArgs } from '../../../shared/gql/graphql.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { allSubfolders } from '../../helpers/allSubfolders.js';
import type { FolderFields } from '../../db/picrDb.js';
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { folderType } from '../types/folderType.js';

const resolver: PicrResolver<object, QueryAllFoldersArgs> = async (
  _,
  params,
  context,
): Promise<FolderFields[]> => {
  await contextPermissions(context, params.id, 'Admin');
  return allSubfolders(
    params.id,
    params.sort ?? undefined,
    params.limit ?? undefined,
  );
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
