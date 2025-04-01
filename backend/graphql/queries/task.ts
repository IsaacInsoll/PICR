import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { taskType } from '../types/taskType';
import { allSubfolderIds } from '../../helpers/allSubfolders';
import { dbFolderForId } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const { user, folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );

  const taskList: Task[] = [];
  const folderIds = await allSubfolderIds(folder);
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
