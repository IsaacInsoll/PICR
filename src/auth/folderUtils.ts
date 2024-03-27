import Folder from '../models/Folder';
import { contextPermissionsForFolder as perms } from './contextPermissionsForFolder';

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

export const ParentFolders = async (
  folder: Folder,
  context,
): Promise<Folder[]> => {
  let current = folder;
  const parents: Folder[] = [];
  while (current.parentId) {
    current = await Folder.findByPk(current.parentId);
    if (!current) break; // in case parent folder no longer exists?
    const [permissions] = await perms(context, folder.id);
    if (!permissions || permissions === 'None') break;
    parents.push(current);
  }
  return parents;
};

// CURRENTLY UNTESTED :P
export const AllChildFolderIds = async (
  folder: Folder,
  // context,
): Promise<Folder[]> => {
  //NOTE: no permissions done here, if you can see parent you can see the children
  let currentIds = [folder.id];
  const all = [folder.id];
  while (currentIds.length > 0) {
    const newlyFound = await Folder.findAll({
      where: { parentId: currentIds },
    });
    if (newlyFound.length) {
      currentIds = newlyFound.map((item) => item.id);
      all.push(...currentIds);
    }
  }
  return all;
};
