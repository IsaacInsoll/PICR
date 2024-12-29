import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { AllChildFolderIds } from '../../auth/folderUtils';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissions } from '../../auth/contextPermissions';
import Folder from '../../models/Folder';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { taskType } from '../types/taskType';

const resolver = async (_, params, context) => {
  const { user } = await contextPermissions(context, params.folderId ?? 1);

  const f = await Folder.findByPk(params.folderId);

  const taskList: Task[] = [];
  const folderIds = await AllChildFolderIds(f);
  taskList.push(...queueZipTaskStatus(folderIds));

  const thumbs = queueTaskStatus();
  if (user && thumbs) taskList.push(thumbs);

  return taskList;
};

export const tasks = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(taskType))),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
