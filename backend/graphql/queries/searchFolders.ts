import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { AllChildFolderIds } from '../../auth/folderUtils';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import Folder from '../../models/Folder';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { taskType } from '../types/taskType';
import { GraphQLString } from 'graphql';
import { relativePath } from '../../filesystem/fileManager';
import { Op } from 'sequelize';
import { folderType } from '../types/folderType';

const resolver = async (_, params, context) => {
  const [p, user] = await contextPermissionsForFolder(
    context,
    params.folderId ?? 1,
    false,
  );

  const f = await Folder.findByPk(params.folderId);
  const folderIds = await AllChildFolderIds(f);

  const lower = params.query.toLowerCase().split(' ');
  const lowerMap = lower.map((l) => ({ [Op.iLike]: `%${l}%` }));
  const folders = await Folder.findAll({
    where: {
      parentId: folderIds,
      exists: true,
      relativePath: { [Op.and]: lowerMap },
    },
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
