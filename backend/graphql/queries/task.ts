import { queueTaskStatus } from '../../filesystem/fileQueue.js';
import type { Task, QueryTasksArgs } from '@shared/gql/graphql.js';
import { queueZipTaskStatus } from '../../helpers/zipQueue.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { taskType } from '../types/taskType.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { mediaScanTaskStatus } from '../../filesystem/mediaScanActivity.js';
import { postBootMaintenanceTaskStatus } from '../../boot/postBootMaintenanceStatus.js';

export const taskResolver: PicrResolver<object, QueryTasksArgs> = async (
  _,
  params,
  context,
) => {
  const { folder, permissions } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );

  const taskList: Task[] = [];
  const folderIds = await allSubfolderIds(folder);
  taskList.push(...queueZipTaskStatus(folderIds));

  if (permissions === 'Admin') {
    const scan = mediaScanTaskStatus();
    if (scan) taskList.push(scan);

    const thumbs = queueTaskStatus();
    if (thumbs) taskList.push(thumbs);

    const maintenance = postBootMaintenanceTaskStatus();
    if (maintenance) taskList.push(maintenance);
  }

  return taskList;
};

export const tasks = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(taskType))),
  resolve: taskResolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
