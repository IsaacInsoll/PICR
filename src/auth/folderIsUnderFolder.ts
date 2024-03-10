import Folder from '../models/Folder';

export const FolderIsUnderFolder = async (
  child: Folder,
  parent: Folder,
): Promise<boolean> => {
  // console.log('FUF ', child.id, ' under ', parent.id);
  if (!child && !parent) return false;
  if (child.id === parent.id) return true;
  if (!child.parentId) return false;
  const childParent = await Folder.findByPk(child.parentId);
  return childParent ? FolderIsUnderFolder(childParent, parent) : false;
};
