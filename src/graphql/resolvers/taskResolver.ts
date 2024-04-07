import { queueTaskStatus } from '../../filesystem/fileQueue';
import { Task } from '../../../frontend/src/gql/graphql';
import { AllChildFolderIds } from '../../auth/folderUtils';
import { queueZipTaskStatus } from '../../helpers/zipQueue';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import Folder from '../../models/Folder';

export const taskResolver = async (_, params, context) => {
  const [p, user] = await contextPermissionsForFolder(
    context,
    params.folderId ?? 1,
    false,
  );

  const f = await Folder.findByPk(params.folderId);

  const taskList: Task[] = [];
  const folderIds = await AllChildFolderIds(f);
  taskList.push(...queueZipTaskStatus(folderIds));

  const thumbs = queueTaskStatus();
  if (user && thumbs) taskList.push(thumbs);

  return taskList;
};
