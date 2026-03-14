import type { FolderFields } from '../db/picrDb.js';
import { dbFolderForId } from '../db/picrDb.js';

const pathIsUnder = (
  childPath?: string | null,
  parentPath?: string | null,
): boolean => {
  if (!childPath || !parentPath) return false;
  return childPath.startsWith(parentPath + '/');
};

export const folderIsUnderFolderId = async (
  child: FolderFields,
  parentId: number,
): Promise<boolean> => {
  if (!child || !parentId) return false;
  if (child.id === parentId) {
    return true;
  }
  if (!child.parentId) return false;
  const parent = await dbFolderForId(parentId);
  if (!parent) return false;
  if (parent.id === 1) return true;

  return pathIsUnder(child.relativePath, parent.relativePath);
};

export const folderIsUnderFolder = (
  child: FolderFields,
  parent?: FolderFields,
): boolean => {
  if (!child || !child.id || !parent || !parent.id) return false;
  if (child.id === parent.id || parent.id === 1) return true;
  if (!child.parentId) return false;
  return pathIsUnder(child.relativePath, parent.relativePath);
};
