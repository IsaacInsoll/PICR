import FolderModel from '../db/FolderModel';
import { contextPermissions } from '../auth/contextPermissions';

export const parentFolders = async (
  folder: FolderModel,
  context,
): Promise<FolderModel[]> => {
  let current = folder;
  const parents: FolderModel[] = [];
  while (current.parentId) {
    current = await FolderModel.findByPk(current.parentId);
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
