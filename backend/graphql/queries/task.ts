import { queueTaskStatus } from '../../filesystem/fileQueue.js';
import { Task } from '../../../shared/gql/graphql.js';
import { queueZipTaskStatus } from '../../helpers/zipQueue.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { taskType } from '../types/taskType.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
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
