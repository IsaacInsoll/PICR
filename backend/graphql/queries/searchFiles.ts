import { allChildFolderIds } from '../../helpers/allChildFolderIds';
import { contextPermissions } from '../../auth/contextPermissions';
import FolderModel from '../../db/FolderModel';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { GraphQLString } from 'graphql';
import { Op } from 'sequelize';
import FileModel from '../../db/FileModel';
import { fileType } from '../types/fileType';
import { allSubFoldersRecursive } from '../../helpers/allSubFoldersRecursive';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId ?? 1, 'View');

  const f = await FolderModel.findByPk(params.folderId);
  const folderIds = await allChildFolderIds(f);

  const lower = params.query.toLowerCase().split(' ');
  const lowerMap = lower.map((l) => ({ [Op.iLike]: `%${l}%` }));
  const files = await FileModel.findAll({
    where: {
      folderId: folderIds,
      exists: true,
      name: { [Op.and]: lowerMap },
    },
    limit: 100,
  });
  const folders = await allSubFoldersRecursive(f.id);
  return files.map((file) => {
    return {
      ...file.toJSON(),
      folder: folders.find(({ id }) => id == file.folderId),
    };
  });
};

export const searchFiles = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(fileType))),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
    query: { type: new GraphQLNonNull(GraphQLString) },
  },
};
