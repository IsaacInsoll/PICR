import Folder from '../models/Folder';
import File from '../models/File';
import { contextPermissionsForFolder as perms } from './contextPermissionsForFolder';
import { FileType } from '../../graphql-types';

export const FolderIsUnderFolderId = async (
  child: Folder,
  parentId: number,
): Promise<boolean> => {
  if (!child || !parentId) return false;
  if (child.id === parentId) {
    return true;
  }
  if (!child.parentId) return false;
  const childParent = await Folder.findByPk(child.parentId);
  if (!childParent) {
    return false;
  }
  return await FolderIsUnderFolderId(childParent, parentId);
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
    const [permissions] = await perms(context, current.id);
    if (!permissions || permissions === 'None') {
      break;
    } else {
      parents.push(current);
    }
  }
  return parents;
};

export const AllChildFolderIds = async (
  folder: Folder,
  // context,
): Promise<string[]> => {
  //NOTE: no permissions done here, if you can see parent you can see the children
  let currentIds = [folder.id];
  const all = [folder.id];
  while (currentIds.length > 0) {
    const newlyFound = await Folder.findAll({
      where: { parentId: currentIds },
    });
    currentIds = newlyFound.map((item) => item.id);
    if (currentIds.length) {
      all.push(...currentIds);
    }
  }
  return all;
};

export const AllChildFiles = async (
  folder: Folder,
  type?: FileType,
): Promise<File[]> => {
  const folderIds = await AllChildFolderIds(folder);
  const where = { folderId: folderIds };
  return File.findAll({ where });
};
