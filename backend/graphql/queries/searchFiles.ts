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
import File from '../../models/File';
import { fileType } from '../types/fileType';
import { allSubFoldersRecursive } from '../helpers/allSubFoldersRecursive';

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
  const files = await File.findAll({
    where: {
      folderId: folderIds,
      exists: true,
      name: { [Op.and]: lowerMap },
    },
    limit: 100,
  });
  const folders = await allSubFoldersRecursive(f.id);
  return files;
  return files.map((file) => {
    return {
      ...file,
      // folder: folders.find(({ id }) => id == file.folderId),
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
