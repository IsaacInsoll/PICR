import { contextPermissions } from '../auth/contextPermissions';
import { dbFolderForId, FolderFields } from '../db/picrDb';

export const parentFolders = async (
  folder: FolderFields,
  context,
): Promise<FolderFields[]> => {
  let current: FolderFields | undefined = folder;
  const parents: FolderFields[] = [];
  while (current.parentId) {
    current = await dbFolderForId(current.parentId);
    if (!current) break; // in case parent folder no longer exists?
    const { permissions } = await contextPermissions(context, current.id);
    if (!permissions || permissions === 'None') {
      break;
    } else {
      parents.push(current);
    }
  }
  return parents;
};
