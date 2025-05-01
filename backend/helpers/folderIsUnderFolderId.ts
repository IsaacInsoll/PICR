import { dbFolderForId, FolderFields } from '../db/picrDb';

export const folderIsUnderFolderId = async (
  child: FolderFields,
  parentId: number,
): Promise<boolean> => {
  // console.log('folderisunderfolderid', child?.id, parentId);
  // console.trace();
  if (!child || !parentId) return false;
  if (child.id == parentId) {
    return true;
  }
  if (!child.parentId) return false;

  const parent = await dbFolderForId(parentId);
  if (!parent) return false;
  if (parent.id == 1) return true;

  return (
    child?.relativePath?.startsWith((parent.relativePath ?? '') + '/') ?? false
  );

  // previous recursive version which was expectedly slower
  // const childParent = await dbFolderForId(child.parentId);
  // if (!childParent) {
  //   return false;
  // }
  // return await folderIsUnderFolderId(childParent, parentId);
};
