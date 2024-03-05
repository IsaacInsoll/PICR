import Folder from '../models/Folder';

export const FolderAndAllParentIds = async (
  folder: Folder,
): Promise<string[]> => {
  let f = folder;
  const ids = [f.id];
  while (f.parentId) {
    ids.push(f.parentId);
    f = await Folder.findByPk(f.parentId);
  }
  return ids;
};
