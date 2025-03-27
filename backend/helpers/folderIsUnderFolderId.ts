import { dbFolderForId, FolderFields } from '../db/picrDb';

export const folderIsUnderFolderId = async (
  child: FolderFields,
  parentId: number,
): Promise<boolean> => {
  if (!child || !parentId) return false;
  if (child.id == parentId) {
    return true;
  }
  if (!child.parentId) return false;
  const childParent = await dbFolderForId(child.parentId);
  if (!childParent) {
    return false;
  }
  return await folderIsUnderFolderId(childParent, parentId);
};
