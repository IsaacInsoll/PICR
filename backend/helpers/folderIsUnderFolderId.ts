import FolderModel from '../db/FolderModel';

export const folderIsUnderFolderId = async (
  child: FolderModel,
  parentId: number,
): Promise<boolean> => {
  if (!child || !parentId) return false;
  if (child.id == parentId) {
    return true;
  }
  if (!child.parentId) return false;
  const childParent = await FolderModel.findByPk(child.parentId);
  if (!childParent) {
    return false;
  }
  return await folderIsUnderFolderId(childParent, parentId);
};
