import FolderModel from '../db/FolderModel';

export const folderAndAllParentIds = async (
  folder: FolderModel,
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
    f = await FolderModel.findByPk(f.parentId);
  }
  if (rootId) {
    throw new Error(
      `RootID ${rootId} not found navigating parents of ${folder.id}`,
    );
  }
  return ids;
};
