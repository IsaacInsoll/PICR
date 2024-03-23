import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';
import { getUserFromToken } from '../../auth/jwt-auth';
import { doAuthError } from '../../auth/doAuthError';
import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';

export const taskResolver = async (_, params, context) => {
  let f = null;
  const taskList: Task[] = [];
  if (params.folderId) {
    const [permissions, u] = await perms(context, params.id, true);
    f = await getFolder(params.id);
  } else {
    const user = await getUserFromToken(context);
    if (!user)
      doAuthError('You must specify a folder or be an admin user to see all');
  }

  //Useful for testing
  // const random: Task = {
  //   name: 'Random Task',
  //   step: Math.floor(Math.random() * 10),
  //   totalSteps: 10,
  // };
  // taskList.push(random);
  const thumbs = queueTaskStatus();
  if (thumbs) taskList.push(thumbs);
  return taskList;
};
