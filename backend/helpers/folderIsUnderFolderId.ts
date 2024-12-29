import Folder from '../models/Folder';

export const folderIsUnderFolderId = async (
  child: Folder,
  parentId: number,
): Promise<boolean> => {
  if (!child || !parentId) return false;
  if (child.id == parentId) {
    return true;
  }
  if (!child.parentId) return false;
  const childParent = await Folder.findByPk(child.parentId);
  if (!childParent) {
    return false;
  }
  return await folderIsUnderFolderId(childParent, parentId);
};
