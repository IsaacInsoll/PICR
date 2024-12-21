import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { AllChildFolderIds } from '../../helpers/folderUtils';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import Folder from '../../models/Folder';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { taskType } from '../types/taskType';
import { DBFolderForId } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const [p, user] = await contextPermissionsForFolder(
    context,
    params.folderId ?? 1,
    false,
  );

  const f = await DBFolderForId(params.folderId);

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
