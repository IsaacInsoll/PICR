import { DBFolder, DBFolderForId } from '../db/picrDb';

export const folderAndAllParentIds = async (
  folder: DBFolder,
  rootId?: number,
): Promise<string[]> => {
  let f: DBFolder | undefined = folder;
  const ids = [f.id];

  if (rootId && f.id == rootId) {
    return ids;
  }

  while (f.parentId) {
    ids.push(f.parentId);
    if (rootId && f.parentId == rootId) {
      return ids;
    }
    f = await DBFolderForId(f?.parentId);
  }
  if (rootId) {
    throw new Error(
      `RootID ${rootId} not found navigating parents of ${folder.id}`,
    );
  }
  return ids;
};
