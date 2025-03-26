import { contextPermissions } from '../../auth/contextPermissions';
import FolderModel from '../../db/sequelize/FolderModel';
import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { AllChildFolderIds } from '../../helpers/folderUtils';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import Folder from '../../models/Folder';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { GraphQLString } from 'graphql';
import { Op } from 'sequelize';
import { folderType } from '../types/folderType';
import { DBFolderForId } from '../../db/picrDb';
import { allSubfolderIds } from '../../helpers/allSubfolders';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );

  const f = await DBFolderForId(params.folderId);
  const folderIds = await AllChildFolderIds(f);

  const lower = params.query.toLowerCase().split(' ');
  const lowerMap = lower.map((l) => ({ [Op.iLike]: `%${l}%` }));
  const folders = await FolderModel.findAll({
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
