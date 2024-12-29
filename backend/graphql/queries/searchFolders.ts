import { allChildFolderIds } from '../../helpers/allChildFolderIds';
import { contextPermissions } from '../../auth/contextPermissions';
import Folder from '../../models/Folder';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { GraphQLString } from 'graphql';
import { Op } from 'sequelize';
import { folderType } from '../types/folderType';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );

  const folderIds = await allChildFolderIds(folder);

  const lower = params.query.toLowerCase().split(' ');
  const lowerMap = lower.map((l) => ({ [Op.iLike]: `%${l}%` }));
  const folders = await Folder.findAll({
    where: {
      parentId: folderIds,
      exists: true,
      relativePath: { [Op.and]: lowerMap },
    },
    limit: 100,
  });
  return folders;
};

export const searchFolders = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
    query: { type: new GraphQLNonNull(GraphQLString) },
  },
};
