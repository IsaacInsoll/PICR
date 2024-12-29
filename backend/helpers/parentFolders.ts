import Folder from '../models/Folder';
import { contextPermissions } from '../auth/contextPermissions';

export const parentFolders = async (
  folder: Folder,
  context,
): Promise<Folder[]> => {
  let current = folder;
  const parents: Folder[] = [];
  while (current.parentId) {
    current = await Folder.findByPk(current.parentId);
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
