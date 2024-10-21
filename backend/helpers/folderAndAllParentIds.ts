import Folder from '../models/Folder';

export const folderAndAllParentIds = async (
  folder: Folder,
  rootId?: number,
): Promise<string[]> => {
  let f = folder;
  const ids = [f.id];

  if (rootId && f.id == rootId) {
    return ids;
  }

  while (f.parentId) {
    ids.push(f.parentId);
    if (rootId && f.parentId == rootId) {
      return ids;
    }
    f = await Folder.findByPk(f.parentId);
  }
  if (rootId) {
    throw new Error(
      `RootID ${rootId} not found navigating parents of ${folder.id}`,
    );
  }
  return ids;
};
