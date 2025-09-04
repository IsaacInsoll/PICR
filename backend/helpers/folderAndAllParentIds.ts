import { dbFolderForId, FolderFields } from '../db/picrDb.js';

export const folderAndAllParentIds = async (
  folder: FolderFields,
  rootId?: number,
): Promise<number[]> => {
  let f: FolderFields | undefined = folder;
  const ids = [f.id];

  if (rootId && f.id == rootId) {
    return ids;
  }

  while (f?.parentId) {
    ids.push(f.parentId);
    if (rootId && f.parentId == rootId) {
      return ids;
    }
    f = await dbFolderForId(f.parentId);
  }
  if (rootId) {
    throw new Error(
      `RootID ${rootId} not found navigating parents of ${folder.id}`,
    );
  }
  return ids;
};
