import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissions } from '../../auth/contextPermissions';
import FolderModel from '../../db/FolderModel';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { taskType } from '../types/taskType';
import { allSubfolderIds } from '../../helpers/allSubfolders';

const resolver = async (_, params, context) => {
  const { user } = await contextPermissions(context, params.folderId ?? 1);

  const f = await FolderModel.findByPk(params.folderId);

  const taskList: Task[] = [];
  const folderIds = await allSubfolderIds(f);
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
