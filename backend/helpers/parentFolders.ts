import { contextPermissions } from '../auth/contextPermissions.js';
import { dbFolderForId, FolderFields } from '../db/picrDb.js';
import { PicrRequestContext } from '../types/PicrRequestContext.js';

export const parentFolders = async (
  folder: FolderFields,
  context: PicrRequestContext,
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
